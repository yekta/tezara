import { createHash } from "node:crypto";
import type { Redis } from "ioredis";
import type { Keys } from "../state/keys.ts";

export type JobKind =
  | "scan-id-range"
  | "refresh-thesis"
  | "discover-head"
  | "reconcile-year"
  | "sync-meili"
  | "sync-clickhouse";

export type Job = {
  id: string;
  kind: JobKind;
  params: Record<string, unknown>;
  attempts: number;
  runAfter: number;
  lastError?: string;
};

export type QueueOptions = {
  leaseMs?: number;
  maxAttempts?: number;
  backoffMs?: (attempt: number) => number;
};

/** Stable id, so re-enqueueing the same work is idempotent rather than duplicating it. */
export function jobId(kind: JobKind, params: Record<string, unknown>): string {
  const canonical = JSON.stringify(params, Object.keys(params).sort());
  return `${kind}:${createHash("sha1").update(canonical).digest("hex").slice(0, 16)}`;
}

const DEFAULT_LEASE_MS = 5 * 60_000;
const DEFAULT_MAX_ATTEMPTS = 5;
const defaultBackoff = (attempt: number) =>
  Math.min(60_000 * 2 ** (attempt - 1), 30 * 60_000) * (0.5 + Math.random());

/**
 * Job kinds that must not queue behind the backfill, highest priority first.
 *
 * Score alone is enqueue order, and the scheduler queues backfill chunks before the sync
 * jobs, so a plain lowest-score-wins claim starves them: crawled theses pile up in the
 * outbox and never reach Meili, while every tick adds another sync job that also waits.
 * Job ids are prefixed with their kind, so the claim can prefer them by prefix.
 */
const PRIORITY_KINDS = [
  "sync-meili",
  "sync-clickhouse",
  "reconcile-year",
  "discover-head",
] as const;

/** How many due jobs to consider when looking for a priority one. */
const CLAIM_WINDOW = 500;

/**
 * Move up to `count` due jobs from pending to leased and return them, atomically.
 * Doing this in Lua is what makes concurrent workers safe: without it, two workers can
 * both read the same member before either removes it.
 *
 * Within the due set, priority kinds are taken first; everything else follows in score
 * order. `runAfter` is still respected, so retry backoff is unaffected.
 */
const CLAIM_LUA = `
local pending, leased = KEYS[1], KEYS[2]
local now, count, leaseUntil, window = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3]), tonumber(ARGV[4])

local candidates = redis.call('ZRANGEBYSCORE', pending, '-inf', now, 'LIMIT', 0, window)
if #candidates == 0 then return {} end

local picked = {}
local taken = {}

for p = 5, #ARGV do
  local prefix = ARGV[p]
  for i = 1, #candidates do
    if #picked >= count then break end
    if not taken[i] and string.sub(candidates[i], 1, string.len(prefix)) == prefix then
      picked[#picked + 1] = candidates[i]
      taken[i] = true
    end
  end
  if #picked >= count then break end
end

for i = 1, #candidates do
  if #picked >= count then break end
  if not taken[i] then
    picked[#picked + 1] = candidates[i]
    taken[i] = true
  end
end

if #picked == 0 then return {} end
redis.call('ZREM', pending, unpack(picked))
for i = 1, #picked do redis.call('ZADD', leased, leaseUntil, picked[i]) end
return picked
`;

/** Return every job whose lease expired to the pending set. This is crash recovery. */
const REAP_LUA = `
local leased, pending, now = KEYS[1], KEYS[2], tonumber(ARGV[1])
local ids = redis.call('ZRANGEBYSCORE', leased, '-inf', now)
if #ids == 0 then return 0 end
redis.call('ZREM', leased, unpack(ids))
for i = 1, #ids do redis.call('ZADD', pending, now, ids[i]) end
return #ids
`;

export class Queue {
  // NB: explicit fields, not constructor parameter properties — `node
  // --experimental-strip-types` (what the Docker image runs) rejects those.
  readonly #redis: Redis;
  readonly #keys: Keys;
  readonly #leaseMs: number;
  readonly #maxAttempts: number;
  readonly #backoff: (attempt: number) => number;

  constructor(redis: Redis, keys: Keys, opts: QueueOptions = {}) {
    this.#redis = redis;
    this.#keys = keys;
    this.#leaseMs = opts.leaseMs ?? DEFAULT_LEASE_MS;
    this.#maxAttempts = opts.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    this.#backoff = opts.backoffMs ?? defaultBackoff;
  }

  /**
   * Idempotent: enqueueing the same (kind, params) twice keeps the EARLIER runAfter,
   * so a scheduler tick can safely re-assert work every minute forever.
   */
  async enqueue(
    kind: JobKind,
    params: Record<string, unknown>,
    runAfter = Date.now(),
  ): Promise<string> {
    const id = jobId(kind, params);
    const job: Job = { id, kind, params, attempts: 0, runAfter };
    const tx = this.#redis.multi();
    tx.hsetnx(this.#keys.job(id), "data", JSON.stringify(job));
    tx.zadd(this.#keys.jobsPending, "LT", String(runAfter), id);
    await tx.exec();
    return id;
  }

  async claim(count = 1): Promise<Job[]> {
    const now = Date.now();
    const ids = (await this.#redis.eval(
      CLAIM_LUA, 2, this.#keys.jobsPending, this.#keys.jobsLeased,
      String(now), String(count), String(now + this.#leaseMs), String(CLAIM_WINDOW),
      ...PRIORITY_KINDS,
    )) as string[];
    if (ids.length === 0) return [];

    const pipeline = this.#redis.pipeline();
    for (const id of ids) pipeline.hget(this.#keys.job(id), "data");
    const results = (await pipeline.exec()) ?? [];

    const jobs: Job[] = [];
    for (const [err, data] of results) {
      if (err || typeof data !== "string") continue;
      jobs.push(JSON.parse(data) as Job);
    }
    return jobs;
  }

  async complete(job: Job): Promise<void> {
    const tx = this.#redis.multi();
    tx.zrem(this.#keys.jobsLeased, job.id);
    tx.del(this.#keys.job(job.id));
    await tx.exec();
  }

  /** Retry with jittered backoff, or dead-letter once attempts are exhausted. */
  async fail(job: Job, error: string): Promise<"retry" | "dead"> {
    const attempts = job.attempts + 1;
    const next: Job = { ...job, attempts, lastError: error };
    const tx = this.#redis.multi();
    tx.zrem(this.#keys.jobsLeased, job.id);
    if (attempts >= this.#maxAttempts) {
      tx.hset(this.#keys.job(job.id), "data", JSON.stringify(next));
      tx.zadd(this.#keys.jobsDead, String(Date.now()), job.id);
      await tx.exec();
      return "dead";
    }
    const runAfter = Date.now() + this.#backoff(attempts);
    tx.hset(this.#keys.job(job.id), "data", JSON.stringify({ ...next, runAfter }));
    tx.zadd(this.#keys.jobsPending, String(runAfter), job.id);
    await tx.exec();
    return "retry";
  }

  /**
   * Extend a lease while the job is still running.
   *
   * Without this, any job that outlives the lease gets reaped and handed to a second
   * worker while the first is still working on it. Long jobs (a 200-id range at two
   * requests a second takes minutes) hit that immediately.
   *
   * Returns false if we no longer hold the lease — the caller should stop, because
   * someone else now owns the job.
   */
  async renewLease(job: Job): Promise<boolean> {
    const renewed = await this.#redis.zadd(
      this.#keys.jobsLeased, "XX", "GT", String(Date.now() + this.#leaseMs), job.id,
    );
    void renewed;
    return (await this.#redis.zscore(this.#keys.jobsLeased, job.id)) !== null;
  }

  /** Requeue jobs whose worker died mid-flight. Run this on a timer. */
  async reap(): Promise<number> {
    return (await this.#redis.eval(
      REAP_LUA, 2, this.#keys.jobsLeased, this.#keys.jobsPending, String(Date.now()),
    )) as number;
  }

  /**
   * The dead-lettered jobs, newest first, with the error that killed each one.
   *
   * The failure is otherwise only in the log stream, which is exactly where it is
   * hardest to find once a hosted log viewer has scrolled past it.
   */
  async deadJobs(limit = 20): Promise<Job[]> {
    // ZREVRANGE 0 -1 is the whole set, so a zero limit has to short-circuit.
    if (limit <= 0) return [];
    const ids = await this.#redis.zrevrange(this.#keys.jobsDead, 0, limit - 1);
    if (ids.length === 0) return [];

    const pipeline = this.#redis.pipeline();
    for (const id of ids) pipeline.hget(this.#keys.job(id), "data");
    const results = (await pipeline.exec()) ?? [];

    const jobs: Job[] = [];
    for (const [err, data] of results) {
      if (err || typeof data !== "string") continue;
      jobs.push(JSON.parse(data) as Job);
    }
    return jobs;
  }

  async stats(): Promise<{ pending: number; leased: number; dead: number }> {
    const [pending, leased, dead] = await Promise.all([
      this.#redis.zcard(this.#keys.jobsPending),
      this.#redis.zcard(this.#keys.jobsLeased),
      this.#redis.zcard(this.#keys.jobsDead),
    ]);
    return { pending, leased, dead };
  }
}
