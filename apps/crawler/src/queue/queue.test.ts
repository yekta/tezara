import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import type { Redis } from "ioredis";
import { makeKeys, type Keys } from "../state/keys.ts";
import { createRedis } from "../state/redis.ts";
import { Queue, jobId } from "./queue.ts";

let redis: Redis;
let keys: Keys;
let queue: Queue;

before(async () => {
  redis = createRedis();
  keys = makeKeys(`tezara:test:${process.pid}:${Math.random().toString(36).slice(2, 8)}`);
});

beforeEach(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  queue = new Queue(redis, keys, { leaseMs: 200, maxAttempts: 3, backoffMs: () => 0 });
});

after(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  await redis.quit();
});

describe("queue", () => {
  test("enqueue then claim returns the job", async () => {
    await queue.enqueue("scan-id-range", { from: 1, to: 10 });
    const [job] = await queue.claim(1);
    assert.equal(job?.kind, "scan-id-range");
    assert.deepEqual(job?.params, { from: 1, to: 10 });
  });

  test("enqueueing identical params twice is idempotent", async () => {
    const a = await queue.enqueue("scan-id-range", { from: 1, to: 10 });
    const b = await queue.enqueue("scan-id-range", { from: 1, to: 10 });
    assert.equal(a, b);
    assert.equal((await queue.stats()).pending, 1);
  });

  test("param order does not change job identity", () => {
    assert.equal(
      jobId("scan-id-range", { from: 1, to: 10 }),
      jobId("scan-id-range", { to: 10, from: 1 }),
    );
  });

  test("re-enqueue keeps the earlier runAfter", async () => {
    const later = Date.now() + 60_000;
    await queue.enqueue("discover-head", { n: 1 }, later);
    await queue.enqueue("discover-head", { n: 1 }, Date.now());
    assert.equal((await queue.claim(1)).length, 1, "should be immediately claimable");
  });

  test("a job scheduled in the future is not claimed", async () => {
    await queue.enqueue("discover-head", { n: 2 }, Date.now() + 60_000);
    assert.equal((await queue.claim(5)).length, 0);
  });

  test("a claimed job is invisible to other workers", async () => {
    await queue.enqueue("scan-id-range", { from: 1, to: 5 });
    assert.equal((await queue.claim(5)).length, 1);
    assert.equal((await queue.claim(5)).length, 0, "second worker must see nothing");
  });

  test("concurrent claims never hand the same job to two workers", async () => {
    for (let i = 0; i < 20; i++) await queue.enqueue("scan-id-range", { from: i, to: i });
    const batches = await Promise.all([
      queue.claim(20), queue.claim(20), queue.claim(20), queue.claim(20),
    ]);
    const claimed = batches.flat().map((j) => j.id);
    assert.equal(claimed.length, 20);
    assert.equal(new Set(claimed).size, 20, "no job may be claimed twice");
  });

  test("complete removes the job entirely", async () => {
    await queue.enqueue("scan-id-range", { from: 1, to: 5 });
    const [job] = await queue.claim(1);
    await queue.complete(job!);
    assert.deepEqual(await queue.stats(), { pending: 0, leased: 0, dead: 0 });
  });

  test("an expired lease is requeued — this is crash recovery", async () => {
    await queue.enqueue("scan-id-range", { from: 1, to: 5 });
    const [job] = await queue.claim(1);
    assert.ok(job, "claimed");
    // worker dies here: never completes, never fails
    assert.equal((await queue.stats()).leased, 1);
    assert.equal(await queue.reap(), 0, "lease is still valid");

    await new Promise((r) => setTimeout(r, 250));
    assert.equal(await queue.reap(), 1, "expired lease should be reclaimed");
    assert.equal((await queue.stats()).pending, 1);
    assert.equal((await queue.claim(1)).length, 1, "another worker can pick it up");
  });

  test("renewLease keeps a long-running job from being reaped out from under us", async () => {
    // Regression: a 200-id range at two requests a second runs longer than the lease.
    // Without renewal the reaper hands the job to a second worker while the first is
    // still crawling it — duplicate work and duplicate writes.
    await queue.enqueue("scan-id-range", { from: 1, to: 200 });
    const [job] = await queue.claim(1);
    assert.ok(job);

    await new Promise((r) => setTimeout(r, 150));
    assert.equal(await queue.renewLease(job), true, "we still hold it");
    assert.equal(await queue.reap(), 0, "renewal pushed the expiry out");
    assert.equal((await queue.stats()).leased, 1);

    // …and once we stop renewing, it does get reclaimed.
    await new Promise((r) => setTimeout(r, 250));
    assert.equal(await queue.reap(), 1);
  });

  test("renewLease reports false once the job was reaped away", async () => {
    await queue.enqueue("scan-id-range", { from: 1, to: 5 });
    const [job] = await queue.claim(1);
    await new Promise((r) => setTimeout(r, 250));
    await queue.reap();
    assert.equal(await queue.renewLease(job!), false, "someone else owns it now");
  });

  test("failures retry until maxAttempts, then dead-letter", async () => {
    await queue.enqueue("scan-id-range", { from: 1, to: 5 });
    for (const expected of ["retry", "retry", "dead"] as const) {
      const [job] = await queue.claim(1);
      assert.ok(job, `claimable before ${expected}`);
      assert.equal(await queue.fail(job, "boom"), expected);
    }
    const stats = await queue.stats();
    assert.equal(stats.dead, 1);
    assert.equal(stats.pending, 0);
    assert.equal(stats.leased, 0);
  });

  test("attempts accumulate across retries", async () => {
    await queue.enqueue("scan-id-range", { from: 9, to: 9 });
    const [first] = await queue.claim(1);
    await queue.fail(first!, "boom");
    const [second] = await queue.claim(1);
    assert.equal(second?.attempts, 1);
    assert.equal(second?.lastError, "boom");
  });
});
