import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import type { Redis } from "ioredis";
import { Queue } from "../queue/queue.ts";
import { makeKeys, type Keys } from "../state/keys.ts";
import { createRedis } from "../state/redis.ts";
import { ScanStore } from "../state/scan.ts";
import { DEFAULT_POLICY, Leader, tick } from "./scheduler.ts";

let redis: Redis;
let keys: Keys;
let queue: Queue;
let scan: ScanStore;

const policy = { ...DEFAULT_POLICY, maxThesisId: 1000, chunkSize: 100, backfillDepth: 3 };

before(() => {
  redis = createRedis();
  keys = makeKeys(`tezara:test:sched:${process.pid}:${Math.random().toString(36).slice(2, 8)}`);
});

beforeEach(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  queue = new Queue(redis, keys);
  scan = new ScanStore(redis, keys);
});

after(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  await redis.quit();
});

describe("leader election", () => {
  test("only one scheduler can hold the lock", async () => {
    const a = new Leader(redis, keys, { ttlMs: 5_000 });
    const b = new Leader(redis, keys, { ttlMs: 5_000 });
    assert.equal(await a.acquire(), true);
    assert.equal(await b.acquire(), false, "second scheduler must not get the lock");
    await a.release();
    assert.equal(await b.acquire(), true, "released lock is available again");
    await b.release();
  });

  test("a crashed scheduler's lock expires on its own", async () => {
    const dead = new Leader(redis, keys, { ttlMs: 60 });
    assert.equal(await dead.acquire(), true);
    // no release() — simulate the process being killed
    await new Promise((r) => setTimeout(r, 90));
    const next = new Leader(redis, keys, { ttlMs: 5_000 });
    assert.equal(await next.acquire(), true, "lock must not be held forever");
    await next.release();
  });

  test("renew keeps our lock but never steals another's", async () => {
    const a = new Leader(redis, keys, { ttlMs: 5_000 });
    const b = new Leader(redis, keys, { ttlMs: 5_000 });
    await a.acquire();
    assert.equal(await a.renew(), true);
    assert.equal(await b.renew(), false, "b does not hold the lock");
    await a.release();
  });
});

describe("scheduler tick", () => {
  test("tops the backfill up to the configured depth", async () => {
    const report = await tick({ queue, scan }, policy);
    assert.equal(report.backfillQueued, 3);
    // 3 backfill chunks + discover-head + sync-meili + sync-clickhouse
    assert.equal((await queue.stats()).pending, 6);
    assert.equal(report.discoverQueued, true);
    assert.equal(report.syncQueued, true);
  });

  test("the backfill cursor advances instead of re-queuing the same range", async () => {
    await tick({ queue, scan }, policy);
    assert.equal(await scan.watermark("backfill"), 301);

    // drain, then tick again — the next ranges must be new ones
    const claimed = await queue.claim(10);
    for (const job of claimed) await queue.complete(job);

    await tick({ queue, scan }, policy);
    const next = await queue.claim(10);
    const ranges = next.map((j) => j.params as { from: number; to: number });
    assert.ok(ranges.every((r) => r.from >= 301), `expected ranges past 301, got ${JSON.stringify(ranges)}`);
  });

  test("does not queue more work while the queue is already deep", async () => {
    await tick({ queue, scan }, policy);
    const before = (await queue.stats()).pending;
    const report = await tick({ queue, scan }, policy);
    assert.equal(report.backfillQueued, 0, "queue already at depth");
    assert.equal((await queue.stats()).pending, before);
  });

  test("discover-head is queued once per interval, not every tick", async () => {
    const now = Date.now();
    assert.equal((await tick({ queue, scan }, policy, now)).discoverQueued, true);
    assert.equal((await tick({ queue, scan }, policy, now + 1_000)).discoverQueued, false);
    const later = now + policy.discoverHeadEveryMs + 1;
    assert.equal((await tick({ queue, scan }, policy, later)).discoverQueued, true);
  });

  test("ids whose tier TTL elapsed are queued for a re-visit", async () => {
    await scan.record(500, "ok");
    const report = await tick({ queue, scan }, policy, Date.now() + 400 * 24 * 60 * 60_000);
    assert.ok(report.refreshQueued > 0, "stale ids must be rescheduled");
  });

  test("a tick is idempotent — running it twice queues the same work once", async () => {
    const now = Date.now();
    await tick({ queue, scan }, policy, now);
    const after1 = await queue.stats();
    // Same instant, so no interval has elapsed and the cursor has not moved.
    await tick({ queue, scan }, policy, now);
    assert.deepEqual(await queue.stats(), after1);
  });

  test("the backfill stops at maxThesisId", async () => {
    await scan.raiseWatermark("backfill", 950);
    const report = await tick({ queue, scan }, { ...policy, backfillDepth: 10 });
    assert.equal(report.backfillQueued, 1, "only one chunk left below the cap");
    const [job] = await queue.claim(1);
    assert.deepEqual(job?.params, { from: 950, to: 1000 });
  });
});
