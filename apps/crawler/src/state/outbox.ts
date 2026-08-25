import type { TCrawledThesis } from "@tezara/core";
import type { Redis } from "ioredis";
import type { Keys } from "./keys.ts";
import { withLock } from "./lock.ts";

/**
 * Crawled theses land here before they reach a projection target.
 *
 * One PAYLOAD per thesis, shared across targets: Meili and ClickHouse each keep only a
 * queue of ids (a ZSET ordered by an enqueue sequence), and the JSON document itself is
 * stored once and deleted when the last target has committed it. The previous shape —
 * a full copy of every thesis in each target's list — meant a projection backlog cost
 * its RAM twice over.
 *
 * The queues fail independently: an outage in either target costs nothing, the crawl
 * keeps running, and that target's backlog drains when it returns. Draining is
 * destructive-on-success only — ids are removed after the push is acknowledged.
 *
 * This buffer is genuinely transient: minutes deep when the drains are healthy. Losing
 * it loses only crawled-but-unprojected work, which the projection reconcile re-crawls.
 */
export type OutboxTarget = "meili" | "clickhouse";

const TARGETS: readonly OutboxTarget[] = ["meili", "clickhouse"];

/** Keep the dead-letter list bounded; it is for inspection, not for storage. */
const MAX_DEAD = 1_000;

/**
 * Remove ids from one target's queue; delete each payload no other queue still wants.
 * Atomic so a concurrent push of the same id (a re-crawl landing mid-drain) cannot be
 * half-observed. KEYS[1]=own queue, KEYS[2]=other queue; ARGV[1]=doc key prefix, rest=ids.
 */
const COMMIT_LUA = `
local mine, other, prefix = KEYS[1], KEYS[2], ARGV[1]
for i = 2, #ARGV do
  local id = ARGV[i]
  redis.call('ZREM', mine, id)
  if not redis.call('ZSCORE', other, id) then
    redis.call('DEL', prefix .. id)
  end
end
return #ARGV - 1
`;

export class Outbox {
  readonly #redis: Redis;
  readonly #prefix: string;
  readonly #lockPrefix: string;
  /** Which targets a push enqueues for — a Meili-only deployment lists only meili. */
  readonly #targets: readonly OutboxTarget[];

  constructor(redis: Redis, keys: Keys, targets: readonly OutboxTarget[] = TARGETS) {
    if (targets.length === 0) throw new Error("outbox needs at least one target");
    this.#redis = redis;
    this.#prefix = `${keys.prefix}:outbox`;
    this.#lockPrefix = keys.lock("outbox");
    this.#targets = targets;
  }

  #queueKey(target: OutboxTarget): string {
    return `${this.#prefix}:q:${target}`;
  }

  #otherQueueKeys(target: OutboxTarget): string[] {
    return TARGETS.filter((t) => t !== target).map((t) => this.#queueKey(t));
  }

  #docKeyPrefix(): string {
    return `${this.#prefix}:doc:`;
  }

  #deadKey(target: OutboxTarget): string {
    return `${this.#prefix}:${target}:dead`;
  }

  async push(theses: readonly TCrawledThesis[]): Promise<number> {
    if (theses.length === 0) return 0;
    // One sequence number per batch keeps ordering FIFO across pushes; within a batch
    // ties order lexically, which is fine — order is fairness, not meaning.
    const seq = await this.#redis.incr(`${this.#prefix}:seq`);
    const pipeline = this.#redis.pipeline();
    for (const thesis of theses) {
      pipeline.set(`${this.#docKeyPrefix()}${thesis.id}`, JSON.stringify(thesis));
      for (const target of this.#targets) {
        pipeline.zadd(this.#queueKey(target), seq, String(thesis.id));
      }
    }
    await pipeline.exec();
    return theses.length;
  }

  /** Read a batch without removing it — commit() does that once the push succeeded. */
  async peek(target: OutboxTarget, limit: number): Promise<TCrawledThesis[]> {
    const ids = await this.#redis.zrange(this.#queueKey(target), 0, limit - 1);
    if (ids.length === 0) return [];
    const raw = await this.#redis.mget(ids.map((id) => `${this.#docKeyPrefix()}${id}`));

    const out: TCrawledThesis[] = [];
    const orphans: string[] = [];
    raw.forEach((doc, i) => {
      // An id with no payload is debris from a partial delete; drop it from the queue
      // or it would be peeked forever.
      if (doc === null) orphans.push(ids[i]!);
      else out.push(JSON.parse(doc) as TCrawledThesis);
    });
    if (orphans.length > 0) await this.#redis.zrem(this.#queueKey(target), ...orphans);
    return out;
  }

  async commit(target: OutboxTarget, ids: readonly number[]): Promise<void> {
    if (ids.length === 0) return;
    await this.#redis.eval(
      COMMIT_LUA, 2,
      this.#queueKey(target), this.#otherQueueKeys(target)[0]!,
      this.#docKeyPrefix(), ...ids.map(String),
    );
  }

  /**
   * Hold this target's drain lock for the length of `fn`, or return null if it is
   * already held. The process is single-instance, but the backfill CLI can drain while
   * the service runs — and peek/commit is only safe for one drainer per target.
   */
  async drain<T>(target: OutboxTarget, fn: () => Promise<T>): Promise<T | null> {
    return withLock(this.#redis, `${this.#lockPrefix}:${target}`, fn);
  }

  /**
   * Park documents the target refuses. Nothing retries these — they are here so a single
   * poisonous record cannot wedge the queue behind it, and so it can be inspected.
   */
  async quarantine(
    target: OutboxTarget,
    docs: readonly unknown[],
    reason: string,
  ): Promise<void> {
    if (docs.length === 0) return;
    const at = new Date().toISOString();
    await this.#redis.rpush(
      this.#deadKey(target),
      ...docs.map((doc) => JSON.stringify({ at, reason, doc })),
    );
    await this.#redis.ltrim(this.#deadKey(target), -MAX_DEAD, -1);
  }

  /** The quarantined documents, newest first, with the reason each was refused. */
  async dead(
    target: OutboxTarget,
    limit = 20,
  ): Promise<{ at: string; reason: string; doc: unknown }[]> {
    // LRANGE -0 -1 is the whole list, so a zero limit has to short-circuit.
    if (limit <= 0) return [];
    const raw = await this.#redis.lrange(this.#deadKey(target), -limit, -1);
    return raw
      .reverse()
      .map((r) => JSON.parse(r) as { at: string; reason: string; doc: unknown });
  }

  async depth(target: OutboxTarget): Promise<number> {
    return this.#redis.zcard(this.#queueKey(target));
  }

  async deadDepth(target: OutboxTarget): Promise<number> {
    return this.#redis.llen(this.#deadKey(target));
  }
}
