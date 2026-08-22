import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import type { Redis } from "ioredis";
import { makeKeys, type Keys } from "../state/keys.ts";
import { createRedis } from "../state/redis.ts";
import { CircuitBreaker } from "./breaker.ts";

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
