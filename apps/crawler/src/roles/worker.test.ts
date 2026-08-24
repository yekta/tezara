import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import type { Redis } from "ioredis";
import { Queue } from "../queue/queue.ts";
import { makeKeys, type Keys } from "../state/keys.ts";
import { Outbox } from "../state/outbox.ts";
import { createRedis } from "../state/redis.ts";
import { ScanStore } from "../state/scan.ts";
import type { JobContext } from "../jobs/context.ts";
import type { MeiliSearch } from "@tezara/meili";
import { INDEXES, INDEX_NAMES } from "@tezara/meili";
import type { TCrawledThesis } from "@tezara/core";
import { runWorker } from "./worker.ts";

/** Enough of Meili for a drain to run: no settings drift, and every push succeeds. */
function fakeMeili() {
  let pushes = 0;
  return {
    getIndexes: async () => ({ results: INDEX_NAMES.map((uid) => ({ uid })) }),
    index: (name: keyof typeof INDEXES) => ({
      getSettings: async () => ({
        filterableAttributes: INDEXES[name].filterable ?? [],
        sortableAttributes: INDEXES[name].sortable ?? [],
        pagination: { maxTotalHits: INDEXES[name].maxTotalHits },
      }),
      addDocuments: async () => {
        await new Promise((r) => setTimeout(r, 5));
        return { taskUid: ++pushes };
      },
      waitForTask: async (taskUid: number) => ({ status: "succeeded", taskUid }),
    }),
  } as unknown as MeiliSearch;
}

const thesis = (id: number) =>
  ({
    id, title_original: `t${id}`, title_translated: null, author: `A${id}`,
    advisors: [], university: "U", institute: "I", department: null, branch: null,
    detail_id_1: "k1", detail_id_2: "k2", year: 2023, thesis_type: "T", language: "L",
    subjects: [], keywords: [], abstract_original: null, abstract_translated: null,
    page_count: null, pdf_url: null, restricted: false,
  }) as TCrawledThesis;

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

  test("lanes run jobs in parallel without ever double-claiming one", async () => {
    for (let i = 0; i < 12; i++) await queue.enqueue("sync-meili", { at: i });

    const seen: string[] = [];
    await runWorker(ctx, queue, {
      exitWhenDrained: true,
      concurrency: 4,
      onEvent: ({ job }) => seen.push(job.id),
    });

    assert.equal(seen.length, 12, "every job ran");
    assert.equal(new Set(seen).size, 12, "no job ran twice across lanes");
    assert.deepEqual(await queue.stats(), { pending: 0, leased: 0, dead: 0 });
  });

  test("a drain that runs out of budget re-queues itself instead of idling", async () => {
    // The scheduler only queues a sync every minute, and the lanes that lose the drain
    // lock consume those as instant skips — so a drain that stops with work left has
    // nothing to pick it up again unless it re-arms here.
    await ctx.outbox.push([...Array(10)].map((_, i) => thesis(i + 1)));
    await queue.enqueue("sync-meili", { at: 1, batchSize: 2, budgetMs: 1 });

    const details: unknown[] = [];
    await runWorker(
      { ...ctx, meili: fakeMeili() },
      queue,
      {
        exitWhenDrained: true,
        onEvent: ({ job, detail }) => {
          if (job.kind === "sync-meili") details.push(detail);
        },
      },
    );

    assert.ok(details.length > 1, `expected the drain to re-arm, ran ${details.length} time(s)`);
    assert.equal(await ctx.outbox.depth(), 0, "and to keep going until the outbox is empty");
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
