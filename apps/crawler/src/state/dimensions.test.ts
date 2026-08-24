import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import type { Redis } from "ioredis";
import { DimensionCache } from "./dimensions.ts";
import { makeKeys, type Keys } from "./keys.ts";
import { createRedis } from "./redis.ts";

let redis: Redis;
let keys: Keys;
let cache: DimensionCache;

before(() => {
  redis = createRedis();
  keys = makeKeys(`tezara:test:dim:${process.pid}:${Math.random().toString(36).slice(2, 8)}`);
});

beforeEach(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  cache = new DimensionCache(redis, keys);
});

after(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  await redis.quit();
});

describe("DimensionCache", () => {
  test("everything is unseen until it is remembered", async () => {
    assert.deepEqual(await cache.unseen("universities", ["a", "b"]), new Set(["a", "b"]));

    await cache.remember("universities", ["a"]);
    assert.deepEqual(await cache.unseen("universities", ["a", "b"]), new Set(["b"]));

    await cache.remember("universities", ["b"]);
    assert.deepEqual(await cache.unseen("universities", ["a", "b"]), new Set());
  });

  test("the answer preserves order-independence and handles the empty case", async () => {
    assert.deepEqual(await cache.unseen("languages", []), new Set());
    await assert.doesNotReject(cache.remember("languages", []));
  });

  test("indexes do not share a set", async () => {
    await cache.remember("universities", ["shared-id"]);
    assert.deepEqual(await cache.unseen("institutes", ["shared-id"]), new Set(["shared-id"]));
  });

  test("remembering twice is idempotent", async () => {
    await cache.remember("subjects", ["x", "y"]);
    await cache.remember("subjects", ["y", "z"]);
    assert.deepEqual(await cache.sizes(), { subjects: 3 });
  });
});
