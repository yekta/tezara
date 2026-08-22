import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import type { Redis } from "ioredis";
import { makeKeys, type Keys } from "./keys.ts";
import { createRedis } from "./redis.ts";
import { RECHECK_MS, ScanStore } from "./scan.ts";

let redis: Redis;
let keys: Keys;
let store: ScanStore;

before(() => {
  redis = createRedis();
  keys = makeKeys(`tezara:test:scan:${process.pid}`);
});

beforeEach(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  store = new ScanStore(redis, keys);
});

after(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  await redis.quit();
});

describe("scan store", () => {
  test("records an outcome and reads it back", async () => {
    await store.record(109, "ok", { contentHash: "abc" });
    const rec = await store.get(109);
    assert.equal(rec?.state, "ok");
    assert.equal(rec?.contentHash, "abc");
    assert.equal(rec?.attempts, 0);
  });

  test("unknown id reads as null", async () => {
    assert.equal(await store.get(999_999), null);
  });

  test("consecutive gaps escalate the recheck interval", async () => {
    const first = await store.record(151, "gap");
    const second = await store.record(151, "gap");
    const third = await store.record(151, "gap");
    assert.equal(first.attempts, 1);
    assert.equal(second.attempts, 2);
    assert.equal(third.attempts, 3);
    assert.ok(
      RECHECK_MS.gap(third.attempts) > RECHECK_MS.gap(first.attempts),
      "backoff must grow",
    );
  });

  test("a gap is rescheduled, never written off", async () => {
    // Thesis 151 is the real case: it looks like a gap under Durum=3 but exists.
    // In-progress theses also carry Tez No 0 until approved, so an empty id today can
    // become a real thesis later.
    await store.record(151, "gap");
    const due = await redis.zscore(keys.scanDue, "151");
    assert.ok(due !== null, "gap must still be scheduled for a future visit");
    assert.ok(Number(due) > Date.now(), "…but not immediately");
  });

  test("a success resets the attempt ladder", async () => {
    await store.record(200, "error");
    await store.record(200, "error");
    const recovered = await store.record(200, "ok");
    assert.equal(recovered.attempts, 0);
  });

  test("errors retry sooner than gaps", () => {
    assert.ok(RECHECK_MS.error(1) < RECHECK_MS.gap(1));
  });

  test("due() returns only ids whose next check has passed", async () => {
    await store.record(1, "ok");
    assert.deepEqual(await store.due(10), [], "freshly recorded ids are not due");
    assert.deepEqual(await store.due(10, Date.now() + RECHECK_MS.ok(0) + 1), [1]);
  });

  test("unvisited() lists the ids still needing a first pass", async () => {
    await store.record(3, "ok");
    await store.record(5, "gap");
    assert.deepEqual(await store.unvisited(1, 6), [1, 2, 4, 6]);
  });

  test("watermark never moves backwards", async () => {
    assert.equal(await store.watermark("head"), null);
    assert.equal(await store.raiseWatermark("head", 1000), 1000);
    assert.equal(await store.raiseWatermark("head", 900), 1000, "must not regress");
    assert.equal(await store.raiseWatermark("head", 1200), 1200);
  });

  test("crawl state carries no TTL, so volatile-lru cannot evict it", async () => {
    await store.record(42, "ok");
    assert.equal(await redis.ttl(keys.scan(42)), -1, "-1 means no expiry set");
    assert.equal(await redis.ttl(keys.scanDue), -1);
  });
});
