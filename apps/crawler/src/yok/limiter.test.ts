import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import type { Redis } from "ioredis";
import { makeKeys, type Keys } from "../state/keys.ts";
import { createRedis } from "../state/redis.ts";
import { CircuitBreaker } from "./breaker.ts";
import { RateLimiter } from "./limiter.ts";

let redis: Redis;
let keys: Keys;

before(() => {
  redis = createRedis();
  keys = makeKeys(`tezara:test:limiter:${process.pid}:${Math.random().toString(36).slice(2, 8)}`);
});

beforeEach(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
});

after(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  await redis.quit();
});

describe("rate limiter", () => {
  test("allows up to capacity immediately, then makes callers wait", async () => {
    const limiter = new RateLimiter(redis, keys, { ratePerSecond: 1, capacity: 3 });
    assert.equal(await limiter.tryAcquire(), 0);
    assert.equal(await limiter.tryAcquire(), 0);
    assert.equal(await limiter.tryAcquire(), 0);
    const wait = await limiter.tryAcquire();
    assert.ok(wait > 0, "fourth request must be told to wait");
    assert.ok(wait <= 1000, `wait should be about one token at 1/s, got ${wait}`);
  });

  test("the budget is shared, not per-instance", async () => {
    // Two workers, one bucket: scaling out must not multiply the load YÖK sees.
    const a = new RateLimiter(redis, keys, { ratePerSecond: 1, capacity: 2 });
    const b = new RateLimiter(redis, keys, { ratePerSecond: 1, capacity: 2 });
    assert.equal(await a.tryAcquire(), 0);
    assert.equal(await b.tryAcquire(), 0);
    assert.ok(await a.tryAcquire() > 0, "second worker consumed the shared budget");
  });

  test("tokens refill over time", async () => {
    const limiter = new RateLimiter(redis, keys, { ratePerSecond: 50, capacity: 1 });
    assert.equal(await limiter.tryAcquire(), 0);
    assert.ok(await limiter.tryAcquire() > 0);
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(await limiter.tryAcquire(), 0, "should have refilled");
  });

  test("acquire() blocks until a token frees up", async () => {
    const limiter = new RateLimiter(redis, keys, { ratePerSecond: 50, capacity: 1 });
    await limiter.acquire();
    const started = Date.now();
    await limiter.acquire();
    assert.ok(Date.now() - started >= 15, "second acquire must have waited");
  });
});

describe("circuit breaker", () => {
  test("starts closed and allows traffic", async () => {
    const breaker = new CircuitBreaker(redis, keys);
    assert.equal(await breaker.state(), "closed");
    assert.equal(await breaker.allow(), true);
  });

  test("opens after the failure threshold and blocks every worker", async () => {
    const breaker = new CircuitBreaker(redis, keys, { failureThreshold: 3, cooldownMs: 60_000 });
    assert.equal(await breaker.recordFailure(), "closed");
    assert.equal(await breaker.recordFailure(), "closed");
    assert.equal(await breaker.recordFailure(), "open");
    assert.equal(await breaker.allow(), false);

    const other = new CircuitBreaker(redis, keys, { failureThreshold: 3, cooldownMs: 60_000 });
    assert.equal(await other.allow(), false, "breaker state is shared across workers");
  });

  test("goes half-open after the cooldown and lets a probe through", async () => {
    const breaker = new CircuitBreaker(redis, keys, { failureThreshold: 1, cooldownMs: 50 });
    await breaker.recordFailure();
    assert.equal(await breaker.allow(), false);
    await new Promise((r) => setTimeout(r, 70));
    assert.equal(await breaker.state(), "half-open");
    assert.equal(await breaker.allow(), true, "one probe is permitted");
  });

  test("a success closes the breaker and clears the failure count", async () => {
    const breaker = new CircuitBreaker(redis, keys, { failureThreshold: 2, cooldownMs: 60_000 });
    await breaker.recordFailure();
    await breaker.recordFailure();
    assert.equal(await breaker.state(), "open");
    await breaker.recordSuccess();
    assert.equal(await breaker.state(), "closed");
    assert.deepEqual(await breaker.stats(), { state: "closed", failures: 0 });
  });
});
