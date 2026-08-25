import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import type { ClickHouseClient } from "@tezara/clickhouse";
import type { TCrawledThesis } from "@tezara/core";
import type { Redis } from "ioredis";
import { makeKeys, type Keys } from "../state/keys.ts";
import { Outbox } from "../state/outbox.ts";
import { createRedis } from "../state/redis.ts";
import {
  DIRTY_MARK, REBUILT_MARK, syncClickhouse, type RebuildMarks,
} from "./sync-clickhouse.ts";

let redis: Redis;
let keys: Keys;
let outbox: Outbox;
let marks: RebuildMarks;

/** In-memory marks — the real ones live in the ClickHouse-backed scan store. */
function memoryMarks(): RebuildMarks {
  const values = new Map<string, number>();
  return {
    watermark: async (name) => values.get(name) ?? null,
    raiseWatermark: async (name, value) => {
      const current = values.get(name) ?? 0;
      if (value > current) values.set(name, value);
      return values.get(name)!;
    },
  };
}

/**
 * A ClickHouse stand-in that records what it was asked to run. syncTheses only calls
 * insert(); rebuildAggregates only calls command(), and its EXCHANGE TABLES is the one
 * statement that makes a rebuild visible to readers — so counting those is counting
 * rebuilds.
 */
function fakeClient(opts: { failRebuild?: () => boolean } = {}) {
  const commands: string[] = [];
  let inserts = 0;
  const client = {
    insert: async () => {
      inserts++;
    },
    command: async ({ query }: { query: string }) => {
      if (query.startsWith("INSERT INTO") && opts.failRebuild?.()) {
        throw new Error("(total) memory limit exceeded: would use 884.34 MiB");
      }
      commands.push(query);
    },
  };
  return {
    client: client as unknown as ClickHouseClient,
    get inserts() {
      return inserts;
    },
    get rebuilds() {
      return commands.filter((q) => q.startsWith("EXCHANGE TABLES universities ")).length;
    },
  };
}

const thesis = (id: number): TCrawledThesis =>
  ({
    id,
    title_original: `t${id}`,
    title_translated: null,
    author: "A",
    advisors: [],
    university: "U",
    institute: "I",
    department: null,
    branch: null,
    detail_id_1: "k1",
    detail_id_2: "k2",
    year: 2020,
    thesis_type: "YL",
    language: "Türkçe",
    subjects: [],
    keywords: [],
    abstract_original: null,
    abstract_translated: null,
    page_count: null,
    pdf_url: null,
    restricted: false,
  }) as TCrawledThesis;

before(() => {
  redis = createRedis();
  keys = makeKeys(`tezara:test:syncch:${process.pid}:${Math.random().toString(36).slice(2, 8)}`);
});

beforeEach(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  outbox = new Outbox(redis, keys, ["clickhouse"]);
  marks = memoryMarks();
});

after(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  await redis.quit();
});

describe("sync-clickhouse", () => {
  test("a push marks the aggregates dirty and rebuilds them", async () => {
    const ch = fakeClient();
    await outbox.push([thesis(1), thesis(2)]);

    const r = await syncClickhouse({ client: ch.client, outbox, marks });

    assert.equal(r.pushed, 2);
    assert.equal(r.remaining, 0);
    assert.deepEqual(r.rebuilt, ["universities", "subject_stats", "thesis_subjects_by_university"]);
    assert.equal(ch.rebuilds, 1);
    const [dirtyAt, rebuiltAt] = await Promise.all([
      marks.watermark(DIRTY_MARK),
      marks.watermark(REBUILT_MARK),
    ]);
    assert.ok(dirtyAt !== null && rebuiltAt !== null && rebuiltAt >= dirtyAt, "clean afterwards");
  });

  test("nothing to push and nothing dirty: no rebuild", async () => {
    const ch = fakeClient();
    const r = await syncClickhouse({ client: ch.client, outbox, marks });
    assert.equal(r.pushed, 0);
    assert.deepEqual(r.rebuilt, []);
    assert.equal(r.rebuildHeld, undefined);
    assert.equal(ch.rebuilds, 0);
  });

  test("a failed rebuild is retried by the next run even though it pushes nothing", async () => {
    // The bug this guards against: the old job rebuilt iff *this run* pushed rows. The
    // queue retried a failed rebuild, the retry found the outbox already drained, pushed
    // nothing, skipped the rebuild, and reported success with stale aggregates.
    let fail = true;
    const ch = fakeClient({ failRebuild: () => fail });
    await outbox.push([thesis(1)]);

    await assert.rejects(
      syncClickhouse({ client: ch.client, outbox, marks }),
      /memory limit exceeded/,
    );
    assert.equal(await outbox.depth("clickhouse"), 0, "the drain itself landed");
    assert.equal(ch.rebuilds, 0);

    fail = false;
    const retry = await syncClickhouse({ client: ch.client, outbox, marks });
    assert.equal(retry.pushed, 0);
    assert.equal(retry.rebuilt.length, 3, "the owed rebuild ran");
    assert.equal(ch.rebuilds, 1);
  });

  test("rebuilds are rate-limited; dirt accumulates and is paid off once the window passes", async () => {
    let clock = 1_000_000;
    const now = () => clock;
    const ch = fakeClient();
    const every = 10 * 60_000;

    await outbox.push([thesis(1)]);
    const first = await syncClickhouse({ client: ch.client, outbox, marks, now }, { rebuildEveryMs: every });
    assert.equal(first.rebuilt.length, 3);

    clock += 60_000;
    await outbox.push([thesis(2)]);
    const second = await syncClickhouse({ client: ch.client, outbox, marks, now }, { rebuildEveryMs: every });
    assert.equal(second.pushed, 1);
    assert.deepEqual(second.rebuilt, []);
    assert.match(String(second.rebuildHeld), /last rebuild 60s ago/);
    assert.equal(ch.rebuilds, 1);

    // Still inside the window, nothing new pushed: still held, still reported as stale.
    clock += 60_000;
    const third = await syncClickhouse({ client: ch.client, outbox, marks, now }, { rebuildEveryMs: every });
    assert.equal(third.pushed, 0);
    assert.match(String(third.rebuildHeld), /last rebuild 120s ago/);
    assert.equal(ch.rebuilds, 1);

    clock += every;
    const fourth = await syncClickhouse({ client: ch.client, outbox, marks, now }, { rebuildEveryMs: every });
    assert.equal(fourth.rebuilt.length, 3);
    assert.equal(fourth.rebuildHeld, undefined);
    assert.equal(ch.rebuilds, 2);

    // Clean now: a fifth run, long after, does nothing.
    clock += every;
    const fifth = await syncClickhouse({ client: ch.client, outbox, marks, now }, { rebuildEveryMs: every });
    assert.deepEqual(fifth.rebuilt, []);
    assert.equal(fifth.rebuildHeld, undefined);
    assert.equal(ch.rebuilds, 2);
  });

  test("rebuild: false drains but leaves the aggregates marked dirty", async () => {
    const ch = fakeClient();
    await outbox.push([thesis(1)]);
    const r = await syncClickhouse({ client: ch.client, outbox, marks }, { rebuild: false });
    assert.equal(r.pushed, 1);
    assert.deepEqual(r.rebuilt, []);
    assert.match(String(r.rebuildHeld), /disabled/);

    const later = await syncClickhouse({ client: ch.client, outbox, marks });
    assert.equal(later.rebuilt.length, 3);
  });

  test("the drain lock also covers the rebuild", async () => {
    const ch = fakeClient();
    await outbox.push([thesis(1)]);
    // While someone else holds the lock, a sync must neither drain nor rebuild.
    const held = await outbox.drain("clickhouse", () => syncClickhouse({ client: ch.client, outbox, marks }));
    assert.equal(held?.skipped, "another drainer holds the lock");
    assert.equal(held?.pushed, 0);
    assert.deepEqual(held?.rebuilt, []);
    assert.equal(ch.rebuilds, 0);
    assert.equal(await outbox.depth("clickhouse"), 1, "nothing drained while the lock was held");
  });
});
