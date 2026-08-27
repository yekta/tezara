import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { createClickhouseClient, migrate, type ClickHouseClient } from "@tezara/clickhouse";
import type { Redis } from "ioredis";
import { ChScanStore } from "../state/ch-scan.ts";
import { makeKeys, type Keys } from "../state/keys.ts";
import { Outbox } from "../state/outbox.ts";
import { createRedis } from "../state/redis.ts";
import { DEFAULT_POLICY, Planner, type LoopPolicy } from "./loop.ts";

// CLICKHOUSE_TEST_URL is a BASE url without a database; see packages/clickhouse tests.
const chBase = process.env.CLICKHOUSE_TEST_URL ?? "http://default:chpass@127.0.0.1:8123";
const chUrl = `${chBase.replace(/\/$/, "")}/tezara_test`;

let ch: ClickHouseClient;
let redis: Redis;
let keys: Keys;
let scan: ChScanStore;
let outbox: Outbox;

/** A minimal outbox document; the planner only ever looks at queue depths. */
const THESIS = {
  id: 1, title_original: "t", title_translated: null, author: "a", advisors: [],
  university: "u", institute: "i", department: null, branch: null,
  detail_id_1: "k", detail_id_2: "k", year: 2020, thesis_type: "T", language: "L",
  subjects: [], keywords: [], abstract_original: null, abstract_translated: null,
  page_count: null, pdf_url: null, restricted: false,
} as never;

/** Timed units pushed out of the way so a test only sees what it enables. */
const CRAWL_ONLY: LoopPolicy = {
  ...DEFAULT_POLICY,
  chunkSize: 50,
  maxThesisId: 200,
  discoverEveryMs: Number.MAX_SAFE_INTEGER,
  reconcileEveryMs: Number.MAX_SAFE_INTEGER,
  projectionsEveryMs: Number.MAX_SAFE_INTEGER,
};

before(async () => {
  ch = createClickhouseClient({ url: chUrl });
  await migrate(ch);
  redis = createRedis();
  keys = makeKeys(`tezara:test:loop:${process.pid}:${Math.random().toString(36).slice(2, 8)}`);
});

beforeEach(async () => {
  await ch.command({ query: "TRUNCATE TABLE crawl_state" });
  await ch.command({ query: "TRUNCATE TABLE crawl_watermarks" });
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  scan = new ChScanStore(ch);
  outbox = new Outbox(redis, keys);
});

after(async () => {
  await ch.close();
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  await redis.quit();
});

describe("planner", () => {
  test("backfill chunks advance the cursor and never overlap", async () => {
    const planner = new Planner(scan, outbox, CRAWL_ONLY);

    const first = await planner.next();
    const second = await planner.next();
    assert.deepEqual(first, { kind: "backfill", from: 1, to: 50 });
    assert.deepEqual(second, { kind: "backfill", from: 51, to: 100 });
  });

  test("the backfill stops at maxThesisId and the planner goes idle", async () => {
    const planner = new Planner(scan, outbox, { ...CRAWL_ONLY, maxThesisId: 60 });

    assert.deepEqual(await planner.next(), { kind: "backfill", from: 1, to: 50 });
    assert.deepEqual(await planner.next(), { kind: "backfill", from: 51, to: 60 });
    assert.equal(await planner.next(), null, "nothing left to do");
  });

  test("the cursor survives a restart once flushed", async () => {
    const planner = new Planner(scan, outbox, CRAWL_ONLY);
    await planner.next();
    await scan.flush();

    const rebooted = new Planner(new ChScanStore(ch), outbox, CRAWL_ONLY);
    assert.deepEqual(await rebooted.next(), { kind: "backfill", from: 51, to: 100 });
  });

  test("due ids are handed out as a refresh, ahead of the backfill", async () => {
    const now = Date.now();
    scan.record(7, "error", { now: now - 60 * 60_000 });
    scan.record(9, "error", { now: now - 60 * 60_000 });
    await scan.flush();
    const planner = new Planner(scan, outbox, CRAWL_ONLY);

    const unit = await planner.next();
    assert.equal(unit?.kind, "refresh");
    assert.deepEqual((unit as { ids: number[] }).ids, [7, 9]);
  });

  test("in-flight refresh ids are not handed out twice", async () => {
    const now = Date.now();
    scan.record(7, "error", { now: now - 60 * 60_000 });
    await scan.flush();
    const planner = new Planner(scan, outbox, CRAWL_ONLY);

    const first = await planner.next();
    assert.equal(first?.kind, "refresh");

    const second = await planner.next();
    assert.equal(second?.kind, "backfill", "the same due id must not go to a second lane");

    // Completing without recording (the unit failed) makes the id due again.
    planner.complete(first!);
    const retry = await planner.next();
    assert.equal(retry?.kind, "refresh");
  });

  test("a recorded and flushed refresh is no longer due", async () => {
    const now = Date.now();
    scan.record(7, "error", { now: now - 60 * 60_000 });
    await scan.flush();
    const planner = new Planner(scan, outbox, { ...CRAWL_ONLY, maxThesisId: 0 });

    const unit = await planner.next();
    assert.equal(unit?.kind, "refresh");
    // The lane records the outcome and flushes before completing — mirror that here.
    scan.record(7, "ok", { contentHash: "h", previous: await scan.get(7) });
    await scan.flush();
    planner.complete(unit!);

    assert.equal(await planner.next(), null, "nothing due anymore");
  });

  test("discover-head runs on its interval and only once at a time", async () => {
    const policy = { ...CRAWL_ONLY, discoverEveryMs: 30 * 60_000 };
    const planner = new Planner(scan, outbox, policy);

    const first = await planner.next();
    assert.equal(first?.kind, "discover-head", "cheap singleton units go first");

    const second = await planner.next();
    assert.equal(second?.kind, "backfill", "not re-handed while running");

    planner.complete(first!);
    assert.equal(
      (await planner.next())?.kind,
      "backfill",
      "and not re-handed after completing until the interval elapses",
    );
  });

  test("reconcile-year cycles through the year range", async () => {
    const policy = {
      ...CRAWL_ONLY,
      reconcileEveryMs: 0,
      reconcileYears: { from: 2000, to: 2001 },
    };
    const planner = new Planner(scan, outbox, policy);

    const years: number[] = [];
    for (let i = 0; i < 3; i++) {
      const unit = await planner.next();
      assert.equal(unit?.kind, "reconcile-year");
      years.push((unit as { year: number }).year);
      planner.complete(unit!);
    }
    assert.deepEqual(years, [2000, 2001, 2000]);
  });

  test("projection reconcile waits for the outboxes to drain", async () => {
    const policy = { ...CRAWL_ONLY, projectionsEveryMs: 24 * 60 * 60_000 };
    const planner = new Planner(scan, outbox, policy);

    await outbox.push([THESIS]);
    assert.equal(
      (await planner.next())?.kind,
      "backfill",
      "in-flight outbox work would read as missing — hold off",
    );

    await outbox.commit("meili", [1]);
    await outbox.commit("clickhouse", [1]);
    assert.equal((await planner.next())?.kind, "reconcile-projections");
  });

  test("crawl work pauses while a projection backlog is at the cap", async () => {
    const planner = new Planner(scan, outbox, { ...CRAWL_ONLY, maxOutboxDepth: 1 });

    await outbox.push([THESIS]);
    assert.equal(await planner.next(), null, "backfill held while a queue is at the cap");

    await outbox.commit("meili", [1]);
    assert.equal(await planner.next(), null, "the clickhouse queue still holds it");

    await outbox.commit("clickhouse", [1]);
    assert.equal((await planner.next())?.kind, "backfill", "resumes once both drain");
  });
});
