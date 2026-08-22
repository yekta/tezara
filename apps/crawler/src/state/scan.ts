import type { Redis } from "ioredis";
import type { Keys } from "./keys.ts";

export type ScanState = "ok" | "gap" | "error";

export type ScanRecord = {
  state: ScanState;
  lastChecked: number;
  attempts: number;
  contentHash?: string;
};

/**
 * Per-thesis-ID crawl state.
 *
 * A `gap` is never final. In-progress theses carry `Tez No: 0` and only get a real id
 * once approved, so an id that is empty today becomes a real thesis later — writing a
 * gap off permanently would silently lose every thesis approved after the first pass.
 * Gaps are therefore rescheduled on a long, decaying interval rather than removed.
 */
export const RECHECK_MS: Record<ScanState, (attempts: number) => number> = {
  // refreshed by tier policy, not here; a long default keeps it out of the way
  ok: () => 30 * 24 * 60 * 60_000,
  // 7d, 14d, 28d … capped at 90d
  gap: (attempts) => Math.min(7 * 2 ** Math.max(0, attempts - 1), 90) * 24 * 60 * 60_000,
  // fast retry: 5m, 10m, 20m … capped at 6h
  error: (attempts) => Math.min(5 * 2 ** Math.max(0, attempts - 1), 360) * 60_000,
};

export class ScanStore {
  // Explicit fields: parameter properties are unsupported under strip-only TS.
  readonly #redis: Redis;
  readonly #keys: Keys;

  constructor(redis: Redis, keys: Keys) {
    this.#redis = redis;
    this.#keys = keys;
  }

  async get(id: number): Promise<ScanRecord | null> {
    const h = await this.#redis.hgetall(this.#keys.scan(id));
    if (!h || Object.keys(h).length === 0) return null;
    return {
      state: h.state as ScanState,
      lastChecked: Number(h.lastChecked),
      attempts: Number(h.attempts ?? 0),
      contentHash: h.contentHash || undefined,
    };
  }

  /** Record an outcome and schedule the next visit. No TTL — see keys.ts. */
  async record(
    id: number,
    state: ScanState,
    opts: { contentHash?: string; now?: number } = {},
  ): Promise<ScanRecord> {
    const now = opts.now ?? Date.now();
    const previous = await this.get(id);
    // Attempts count consecutive non-ok outcomes; a success resets the ladder.
    const attempts = state === "ok" ? 0 : (previous?.state === state ? previous.attempts : 0) + 1;
    const next: ScanRecord = { state, lastChecked: now, attempts, contentHash: opts.contentHash };

    const fields: Record<string, string> = {
      state, lastChecked: String(now), attempts: String(attempts),
    };
    if (opts.contentHash) fields.contentHash = opts.contentHash;

    const tx = this.#redis.multi();
    tx.hset(this.#keys.scan(id), fields);
    tx.zadd(this.#keys.scanDue, String(now + RECHECK_MS[state](attempts)), String(id));
    await tx.exec();
    return next;
  }

  /** Ids whose next check is due. */
  async due(limit: number, now = Date.now()): Promise<number[]> {
    const ids = await this.#redis.zrangebyscore(
      this.#keys.scanDue, "-inf", String(now), "LIMIT", 0, limit,
    );
    return ids.map(Number);
  }

  /** Ids in [from, to] that have never been visited — the backfill work list. */
  async unvisited(from: number, to: number): Promise<number[]> {
    const pipeline = this.#redis.pipeline();
    for (let id = from; id <= to; id++) pipeline.exists(this.#keys.scan(id));
    const results = (await pipeline.exec()) ?? [];
    const out: number[] = [];
    results.forEach(([err, exists], i) => {
      if (!err && exists === 0) out.push(from + i);
    });
    return out;
  }

  async counts(): Promise<{ tracked: number; due: number }> {
    const [tracked, due] = await Promise.all([
      this.#redis.zcard(this.#keys.scanDue),
      this.#redis.zcount(this.#keys.scanDue, "-inf", String(Date.now())),
    ]);
    return { tracked, due };
  }

  async watermark(name: string): Promise<number | null> {
    const v = await this.#redis.get(this.#keys.watermark(name));
    return v === null ? null : Number(v);
  }

  /** Monotonic: the head watermark must never move backwards. */
  async raiseWatermark(name: string, value: number): Promise<number> {
    const key = this.#keys.watermark(name);
    const current = await this.#redis.get(key);
    if (current !== null && Number(current) >= value) return Number(current);
    await this.#redis.set(key, String(value));
    return value;
  }
}
