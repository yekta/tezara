import type { TCrawledThesis } from "@tezara/core";
import type { Redis } from "ioredis";
import type { Keys } from "./keys.ts";
import { withLock } from "./lock.ts";

/**
 * Crawled theses land here before they reach a projection target.
 *
 * One queue per target, because Meili and ClickHouse fail independently: an outage in
 * either costs nothing, the crawl keeps running, and that backlog drains when the target
 * returns. Draining is destructive-on-success only — documents are removed after the
 * push is acknowledged, never before.
 */
export type OutboxTarget = "meili" | "clickhouse";

/** Keep the dead-letter list bounded; it is for inspection, not for storage. */
const MAX_DEAD = 1_000;

export class Outbox {
  readonly #redis: Redis;
  readonly #key: string;
  readonly #deadKey: string;
  readonly #lockKey: string;

  constructor(redis: Redis, keys: Keys, target: OutboxTarget = "meili") {
    this.#redis = redis;
    this.#key = `${keys.prefix}:outbox:${target}`;
    this.#deadKey = `${keys.prefix}:outbox:${target}:dead`;
    this.#lockKey = keys.lock(`outbox:${target}`);
  }

  async push(theses: readonly TCrawledThesis[]): Promise<number> {
    if (theses.length === 0) return 0;
    return this.#redis.rpush(this.#key, ...theses.map((t) => JSON.stringify(t)));
  }

  /** Read a batch without removing it — commit() does that once the push succeeded. */
  async peek(limit: number): Promise<TCrawledThesis[]> {
    const raw = await this.#redis.lrange(this.#key, 0, limit - 1);
    return raw.map((r) => JSON.parse(r) as TCrawledThesis);
  }

  async commit(count: number): Promise<void> {
    if (count > 0) await this.#redis.ltrim(this.#key, count, -1);
  }

  /**
   * Hold the drain lock for the length of `fn`, or return null if another worker has it.
   *
   * peek/commit is only safe for one drainer at a time: two workers that peek the same
   * head both commit its length, and the second LTRIM discards a batch nobody pushed.
   * The scheduler queues a sync job every minute under a fresh id and the worker gives
   * those jobs claim priority, so several really do run at once.
   */
  async drain<T>(fn: () => Promise<T>): Promise<T | null> {
    return withLock(this.#redis, this.#lockKey, fn);
  }

  /**
   * Park documents the target refuses. Nothing retries these — they are here so a single
   * poisonous record cannot wedge the queue behind it, and so it can be inspected.
   */
  async quarantine(docs: readonly unknown[], reason: string): Promise<void> {
    if (docs.length === 0) return;
    const at = new Date().toISOString();
    await this.#redis.rpush(
      this.#deadKey,
      ...docs.map((doc) => JSON.stringify({ at, reason, doc })),
    );
    await this.#redis.ltrim(this.#deadKey, -MAX_DEAD, -1);
  }

  async depth(): Promise<number> {
    return this.#redis.llen(this.#key);
  }

  async deadDepth(): Promise<number> {
    return this.#redis.llen(this.#deadKey);
  }
}
