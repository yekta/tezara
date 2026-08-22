import type { Redis } from "ioredis";
import type { Keys } from "./keys.ts";

export type YearReconciliation = {
  year: number;
  /** What YÖK reports for this year. */
  reported: number;
  /** What we actually hold. */
  held: number;
  /** reported - held. Positive means we are missing records. */
  drift: number;
  checkedAt: number;
};

/**
 * Per-year drift, the crawler's own correctness check.
 *
 * Enumerating ids 1..max should find everything, but "should" is not "does" — a run of
 * errors, a silently dropped filter, or a YÖK change could leave holes. Comparing our
 * per-year counts against YÖK's own totals is an independent oracle that costs 68
 * requests for the whole corpus.
 */
export class ReconcileStore {
  readonly #redis: Redis;
  readonly #keys: Keys;

  constructor(redis: Redis, keys: Keys) {
    this.#redis = redis;
    this.#keys = keys;
  }

  #key(year: number) {
    return `${this.#keys.prefix}:recon:${year}`;
  }

  async record(entry: YearReconciliation): Promise<void> {
    await this.#redis.hset(this.#key(entry.year), {
      reported: String(entry.reported),
      held: String(entry.held),
      drift: String(entry.drift),
      checkedAt: String(entry.checkedAt),
    });
  }

  async get(year: number): Promise<YearReconciliation | null> {
    const h = await this.#redis.hgetall(this.#key(year));
    if (!h || Object.keys(h).length === 0) return null;
    return {
      year,
      reported: Number(h.reported),
      held: Number(h.held),
      drift: Number(h.drift),
      checkedAt: Number(h.checkedAt),
    };
  }

  async all(): Promise<YearReconciliation[]> {
    const pattern = `${this.#keys.prefix}:recon:*`;
    const keys: string[] = [];
    let cursor = "0";
    do {
      const [next, batch] = await this.#redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
      cursor = next;
      keys.push(...batch);
    } while (cursor !== "0");

    const out: YearReconciliation[] = [];
    for (const key of keys) {
      const year = Number(key.slice(key.lastIndexOf(":") + 1));
      const entry = await this.get(year);
      if (entry) out.push(entry);
    }
    return out.sort((a, b) => a.year - b.year);
  }

  /** Total records we are missing across every year checked so far. */
  async totalDrift(): Promise<number> {
    return (await this.all()).reduce((sum, e) => sum + Math.max(0, e.drift), 0);
  }
}
