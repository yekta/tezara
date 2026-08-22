import type { CircuitBreaker } from "./breaker.ts";

/**
 * What every outbound YÖK request passes through. Kept as an interface so a session can
 * run without Redis (the probe CLI, tests) using a plain delay instead.
 *
 * Throughput is controlled by worker concurrency, not by a rate limit: request rate is
 * roughly concurrency divided by round-trip latency, which is one number to reason about
 * instead of two that interact.
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

/** Shared circuit breaker, so a failing upstream parks every lane at once. */
export function redisGate(breaker: CircuitBreaker): Gate {
  return {
    async before() {
      if (!(await breaker.allow())) throw new BreakerOpenError();
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
