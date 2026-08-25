import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { createClickhouseClient, migrate, type ClickHouseClient } from "@tezara/clickhouse";
import { ChScanStore, RECHECK_MS } from "./ch-scan.ts";

/**
 * Integration test against a real ClickHouse — the store is thin SQL, and faking the
 * SQL would test the fake. Run one locally with:
 *   docker run -d -p 127.0.0.1:8123:8123 -e CLICKHOUSE_DB=tezara_test \
 *     -e CLICKHOUSE_PASSWORD=chpass clickhouse/clickhouse-server:24.8-alpine
 */
// Same convention as packages/clickhouse: CLICKHOUSE_TEST_URL is a BASE url without
// a database, and the test database is appended here.
const base = process.env.CLICKHOUSE_TEST_URL ?? "http://default:chpass@127.0.0.1:8123";
const url = `${base.replace(/\/$/, "")}/tezara_test`;

let ch: ClickHouseClient;
let store: ChScanStore;

before(async () => {
  ch = createClickhouseClient({ url });
  await migrate(ch);
});

beforeEach(async () => {
  await ch.command({ query: "TRUNCATE TABLE crawl_state" });
  await ch.command({ query: "TRUNCATE TABLE crawl_watermarks" });
  store = new ChScanStore(ch);
});

after(async () => {
  await ch.close();
});

describe("clickhouse scan store", () => {
  test("records are buffered until flush, then read back", async () => {
    store.record(109, "ok", { contentHash: "abc" });
    assert.equal(store.buffered, 1);
    assert.equal(await store.get(109), null, "not visible before flush");

    await store.flush();
    const rec = await store.get(109);
    assert.equal(rec?.state, "ok");
    assert.equal(rec?.contentHash, "abc");
    assert.equal(rec?.attempts, 0);
  });

  test("unknown id reads as null", async () => {
    assert.equal(await store.get(999_999), null);
  });

  test("consecutive gaps escalate the recheck interval; ok resets the ladder", async () => {
    // Thesis 151 is the real case: it looks like a gap under Durum=3 but exists.
    const first = store.record(151, "gap");
    const second = store.record(151, "gap", { previous: first });
    const third = store.record(151, "gap", { previous: second });
    assert.equal(third.attempts, 3);
    assert.ok(RECHECK_MS.gap(3) > RECHECK_MS.gap(1), "backoff must grow");

    const reset = store.record(151, "ok", { previous: third });
    assert.equal(reset.attempts, 0);

    // A different failure kind restarts its own ladder rather than inheriting.
    const err = store.record(151, "error", { previous: third });
    assert.equal(err.attempts, 1);
  });

  test("a re-record replaces: the latest state wins after flush", async () => {
    store.record(5, "error");
    await store.flush();
    store.record(5, "ok", { contentHash: "h", previous: await store.get(5) });
    await store.flush();

    const rec = await store.get(5);
    assert.equal(rec?.state, "ok");
    assert.equal((await store.counts()).tracked, 1, "one id, not two rows");
  });

  test("due returns ids whose next check has arrived, soonest first", async () => {
    const now = Date.now();
    store.record(1, "error", { now }); // due in ~5 minutes
    store.record(2, "ok", { now });    // due in ~30 days
    store.record(3, "error", { now: now - 10 * 60_000 }); // already due
    await store.flush();

    assert.deepEqual(await store.due(10, now), [3]);
    const soon = await store.due(10, now + 6 * 60_000);
    assert.deepEqual(soon, [3, 1], "soonest first, the ok id still far out");
  });

  test("recordedInRange answers the backfill's skip list in one query", async () => {
    store.record(10, "ok");
    store.record(12, "gap");
    await store.flush();

    const recorded = await store.recordedInRange(10, 14);
    assert.deepEqual([...recorded].sort(), [10, 12]);
  });

  test("getMany fetches a batch with their hashes", async () => {
    store.record(1, "ok", { contentHash: "h1" });
    store.record(2, "gap");
    await store.flush();

    const got = await store.getMany([1, 2, 3]);
    assert.equal(got.size, 2);
    assert.equal(got.get(1)?.contentHash, "h1");
    assert.equal(got.get(2)?.state, "gap");
  });

  test("watermarks are monotonic, buffered, and survive a fresh store", async () => {
    assert.equal(await store.watermark("head"), null);

    await store.raiseWatermark("head", 100);
    await store.raiseWatermark("head", 50);
    assert.equal(await store.watermark("head"), 100, "never moves backwards");
    await store.flush();

    const fresh = new ChScanStore(ch);
    assert.equal(await fresh.watermark("head"), 100, "persisted across restarts");
  });

  test("a failed flush keeps the buffer so the next flush retries it", async () => {
    const broken = new ChScanStore({
      ...ch,
      insert: async () => {
        throw new Error("clickhouse is down");
      },
      query: ch.query.bind(ch),
    } as unknown as ClickHouseClient);

    broken.record(1, "ok");
    await assert.rejects(broken.flush(), /down/);
    assert.equal(broken.buffered, 1, "nothing was silently dropped");
  });

  test("counts sees tracked and due through FINAL", async () => {
    const now = Date.now();
    store.record(1, "ok", { now });
    store.record(2, "error", { now: now - 60 * 60_000 });
    await store.flush();

    const counts = await store.counts(now);
    assert.equal(counts.tracked, 2);
    assert.equal(counts.due, 1);
  });
});
