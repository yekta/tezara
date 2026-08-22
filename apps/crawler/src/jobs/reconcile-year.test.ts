import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import type { Redis } from "ioredis";
import { makeKeys, type Keys } from "../state/keys.ts";
import { createRedis } from "../state/redis.ts";
import { ReconcileStore } from "../state/reconcile.ts";

let redis: Redis;
let keys: Keys;
let store: ReconcileStore;

before(() => {
  redis = createRedis();
  keys = makeKeys(`tezara:test:recon:${process.pid}:${Math.random().toString(36).slice(2, 8)}`);
});

beforeEach(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  store = new ReconcileStore(redis, keys);
});

after(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  await redis.quit();
});

const entry = (year: number, reported: number, held: number) => ({
  year, reported, held, drift: reported - held, checkedAt: Date.now(),
});

describe("reconcile store", () => {
  test("records and reads back a year", async () => {
    await store.record(entry(2023, 66_114, 66_114));
    const got = await store.get(2023);
    assert.equal(got?.reported, 66_114);
    assert.equal(got?.drift, 0);
  });

  test("an unchecked year reads as null", async () => {
    assert.equal(await store.get(1999), null);
  });

  test("positive drift means we are missing records", async () => {
    await store.record(entry(2023, 66_114, 66_090));
    assert.equal((await store.get(2023))?.drift, 24);
  });

  test("totalDrift sums only the years where we are short", async () => {
    await store.record(entry(2021, 100, 100));   // clean
    await store.record(entry(2022, 100, 90));    // missing 10
    await store.record(entry(2023, 100, 95));    // missing 5
    // Holding MORE than YÖK reports is not a coverage hole, so it must not offset.
    await store.record(entry(2024, 100, 130));
    assert.equal(await store.totalDrift(), 15);
  });

  test("all() returns every checked year in order", async () => {
    await store.record(entry(2023, 1, 1));
    await store.record(entry(1990, 1, 1));
    await store.record(entry(2005, 1, 1));
    assert.deepEqual((await store.all()).map((e) => e.year), [1990, 2005, 2023]);
  });

  test("re-checking a year overwrites the previous result", async () => {
    await store.record(entry(2023, 100, 80));
    assert.equal((await store.get(2023))?.drift, 20);
    await store.record(entry(2023, 100, 100));
    assert.equal((await store.get(2023))?.drift, 0, "a fixed year must clear its drift");
    assert.equal(await store.totalDrift(), 0);
  });

  test("reconciliation state carries no TTL", async () => {
    await store.record(entry(2023, 1, 1));
    assert.equal(await redis.ttl(`${keys.prefix}:recon:2023`), -1);
  });
});
