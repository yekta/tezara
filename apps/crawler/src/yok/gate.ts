import type { CircuitBreaker } from "./breaker.ts";
import type { RateLimiter } from "./limiter.ts";

/**
 * What every outbound YÖK request passes through. Kept as an interface so a session can
 * run without Redis (the probe CLI, tests) using a plain delay instead.
 */
export type Gate = {
  before(signal?: AbortSignal): Promise<void>;
  after(ok: boolean): Promise<void>;
};

export class BreakerOpenError extends Error {
  constructor() {
    super("circuit breaker is open — YÖK is failing or in maintenance");
    this.name = "BreakerOpenError";
  }
}

/** Shared-budget gate: global rate limit plus a shared circuit breaker. */
export function redisGate(limiter: RateLimiter, breaker: CircuitBreaker): Gate {
  return {
    async before(signal) {
      if (!(await breaker.allow())) throw new BreakerOpenError();
      await limiter.acquire(1, signal);
    },
    async after(ok) {
      if (ok) await breaker.recordSuccess();
      else await breaker.recordFailure();
    },
  };
}

/** Fixed-delay gate for single-process use with no Redis. */
export function delayGate(delayMs: number): Gate {
  let last = 0;
  return {
    async before() {
      const wait = delayMs - (Date.now() - last);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      last = Date.now();
    },
    async after() {},
  };
}
