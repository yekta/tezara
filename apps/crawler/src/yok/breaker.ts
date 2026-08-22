import type { Redis } from "ioredis";
import type { Keys } from "../state/keys.ts";

export type BreakerState = "closed" | "open" | "half-open";

export type BreakerOptions = {
  failureThreshold?: number;
  cooldownMs?: number;
};

/**
 * Circuit breaker shared across workers.
 *
 * Replaces the previous pipeline's per-record retry loop, which slept up to seven hours
 * inside a 500-wide Promise.all when YÖK went into maintenance. Here a burst of failures
 * parks every worker at once, and one probe request decides when to resume.
 */
export class CircuitBreaker {
  readonly #redis: Redis;
  readonly #key: string;
  readonly #threshold: number;
  readonly #cooldownMs: number;

  constructor(redis: Redis, keys: Keys, opts: BreakerOptions = {}) {
    this.#redis = redis;
    this.#key = `${keys.prefix}:breaker:yok`;
    this.#threshold = opts.failureThreshold ?? 5;
    this.#cooldownMs = opts.cooldownMs ?? 5 * 60_000;
  }

  async state(now = Date.now()): Promise<BreakerState> {
    const h = await this.#redis.hgetall(this.#key);
    if (!h.state || h.state === "closed") return "closed";
    const openedAt = Number(h.openedAt ?? 0);
    return now - openedAt >= this.#cooldownMs ? "half-open" : "open";
  }

  /** True when a request may proceed. In half-open, exactly one probe is let through. */
  async allow(now = Date.now()): Promise<boolean> {
    const state = await this.state(now);
    if (state === "closed") return true;
    if (state === "open") return false;
    // half-open: first caller to claim the probe wins
    const claimed = await this.#redis.hset(this.#key, "probe", String(now));
    void claimed;
    return true;
  }

  async recordSuccess(): Promise<void> {
    await this.#redis.del(this.#key);
  }

  async recordFailure(now = Date.now()): Promise<BreakerState> {
    const failures = await this.#redis.hincrby(this.#key, "failures", 1);
    if (failures >= this.#threshold) {
      await this.#redis.hset(this.#key, { state: "open", openedAt: String(now) });
      return "open";
    }
    return "closed";
  }

  async stats(): Promise<{ state: BreakerState; failures: number }> {
    const h = await this.#redis.hgetall(this.#key);
    return { state: await this.state(), failures: Number(h.failures ?? 0) };
  }
}
