import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import type { Redis } from "ioredis";
import { Queue } from "../queue/queue.ts";
import { makeKeys, type Keys } from "../state/keys.ts";
import { Outbox } from "../state/outbox.ts";
import { createRedis } from "../state/redis.ts";
import { ScanStore } from "../state/scan.ts";
import type { JobContext } from "../jobs/context.ts";
import { runWorker } from "./worker.ts";

let redis: Redis;
let keys: Keys;
let queue: Queue;
let ctx: JobContext;

before(() => {
  redis = createRedis();
  keys = makeKeys(`tezara:test:worker:${process.pid}:${Math.random().toString(36).slice(2, 8)}`);
});

beforeEach(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  queue = new Queue(redis, keys, { maxAttempts: 2, backoffMs: () => 0 });
  // A crawl-only worker: no Meili, no ClickHouse.
  ctx = {
    session: null as never,
    queue,
    scan: new ScanStore(redis, keys),
    lookups: { subjectEnByTr: new Map(), universityCanon: new Map() },
    outbox: new Outbox(redis, keys, "meili"),
  };
});

after(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  await redis.quit();
});

describe("worker", () => {
  test("skips sync jobs when the projection target is unconfigured", async () => {
    // The scheduler cannot know which targets a worker has, so it queues both. A
    // Meili-only deployment must not dead-letter every sync-clickhouse job forever.
    await queue.enqueue("sync-clickhouse", { at: 1 });
    await queue.enqueue("sync-meili", { at: 1 });

    const events: { kind: string; outcome: string; detail: unknown }[] = [];
    await runWorker(ctx, queue, {
      exitWhenDrained: true,
      onEvent: ({ job, outcome, detail }) => events.push({ kind: job.kind, outcome, detail }),
    });

    assert.equal(events.length, 2);
    assert.ok(events.every((e) => e.outcome === "ok"), `expected both to succeed: ${JSON.stringify(events)}`);
    for (const e of events) {
      assert.match(String((e.detail as { skipped?: string }).skipped), /no .* configured/);
    }
    assert.deepEqual(await queue.stats(), { pending: 0, leased: 0, dead: 0 });
  });

  test("an unknown job kind fails rather than silently succeeding", async () => {
    await queue.enqueue("refresh-thesis", { id: 1 });
    const outcomes: string[] = [];
    await runWorker(ctx, queue, {
      exitWhenDrained: true,
      onEvent: ({ outcome }) => outcomes.push(outcome),
    });
    assert.ok(outcomes.includes("retry") || outcomes.includes("dead"), `got ${outcomes}`);
  });
});
