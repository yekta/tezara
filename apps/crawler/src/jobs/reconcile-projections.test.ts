import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { createClickhouseClient, migrate, type ClickHouseClient } from "@tezara/clickhouse";
import type { MeiliSearch } from "@tezara/meili";
import { ChScanStore } from "../state/ch-scan.ts";
import { reconcileProjections } from "./reconcile-projections.ts";

// CLICKHOUSE_TEST_URL is a BASE url without a database; see packages/clickhouse tests.
const chBase = process.env.CLICKHOUSE_TEST_URL ?? "http://default:chpass@127.0.0.1:8123";
const chUrl = `${chBase.replace(/\/$/, "")}/tezara_test`;

let ch: ClickHouseClient;
let scan: ChScanStore;

/** Just enough of Meili: a year facet, paged id listings per year, and deletes. */
function fakeMeili(idsByYear: Record<number, number[]>) {
  return {
    getTask: async () => ({ status: "succeeded" }),
    index: () => ({
      deleteDocuments: async (ids: number[]) => {
        for (const [year, held] of Object.entries(idsByYear)) {
          idsByYear[Number(year)] = held.filter((id) => !ids.includes(id));
        }
        return { taskUid: 1 };
      },
      search: async (_q: string, opts: { facets?: string[]; filter?: string }) => {
        if (opts.facets) {
          const year = Object.fromEntries(
            Object.entries(idsByYear).map(([y, ids]) => [y, ids.length]),
          );
          return { hits: [], facetDistribution: { year } };
        }
        const year = Number(/year = (\d+)/.exec(opts.filter ?? "")?.[1]);
        return {
          hits: (idsByYear[year] ?? []).map((id) => ({ id })),
          totalPages: 1,
        };
      },
    }),
  } as unknown as MeiliSearch;
}

async function insertState(
  rows: { id: number; state?: string; nextCheckAt?: number }[],
): Promise<void> {
  const now = Date.now();
  await ch.insert({
    table: "crawl_state",
    format: "JSONEachRow",
    values: rows.map((r) => ({
      id: r.id,
      state: r.state ?? "ok",
      last_checked: now,
      next_check_at: r.nextCheckAt ?? now + 30 * 24 * 60 * 60_000,
      attempts: 0,
      content_hash: "somehash",
    })),
  });
}

async function insertTheses(rows: { id: number; year: number }[]): Promise<void> {
  await ch.insert({
    table: "theses",
    format: "JSONEachRow",
    values: rows.map((r) => ({
      id: r.id, author: "a", university: "u", institute: "i", year: r.year,
      thesis_type: "T", language: "L", page_count: null, department: null,
      branch: null, restricted: 0,
    })),
  });
}

before(async () => {
  ch = createClickhouseClient({ url: chUrl });
  await migrate(ch);
});

beforeEach(async () => {
  for (const table of ["crawl_state", "crawl_watermarks", "theses"]) {
    await ch.command({ query: `TRUNCATE TABLE ${table}` });
  }
  scan = new ChScanStore(ch);
});

after(async () => {
  await ch.close();
});

describe("reconcileProjections", () => {
  test("an ok id missing from clickhouse is re-marked due with its hash cleared", async () => {
    await insertState([{ id: 1 }, { id: 2 }]);
    await insertTheses([{ id: 1, year: 2020 }]);

    const result = await reconcileProjections({ clickhouse: ch, scan });

    assert.equal(result.missingInClickhouse, 1);
    assert.deepEqual(await scan.due(10), [2], "the lost id is back on the refresh path");
    const rec = await scan.get(2);
    assert.equal(rec?.contentHash, undefined, "cleared, so the refresh re-pushes it");
  });

  test("an id clickhouse holds but meili lacks is re-marked due", async () => {
    await insertState([{ id: 1 }, { id: 2 }]);
    await insertTheses([{ id: 1, year: 2020 }, { id: 2, year: 2020 }]);
    const meili = fakeMeili({ 2020: [1] });

    const result = await reconcileProjections({ clickhouse: ch, meili, scan });

    assert.equal(result.missingInClickhouse, 0);
    assert.equal(result.missingInMeili, 1);
    assert.deepEqual(await scan.due(10), [2]);
  });

  test("a blocked id missing from meili is neither counted as drift nor re-queued", async () => {
    await insertState([{ id: 1 }, { id: 2 }, { id: 3 }]);
    await insertTheses([{ id: 1, year: 2020 }, { id: 2, year: 2020 }, { id: 3, year: 2020 }]);
    const meili = fakeMeili({ 2020: [1] });

    const result = await reconcileProjections({
      clickhouse: ch, meili, scan, blocked: new Set([2]),
    });

    assert.equal(result.missingInMeili, 1, "only the unblocked gap counts");
    assert.deepEqual(await scan.due(10), [3]);
  });

  test("years whose counts agree are not enumerated", async () => {
    await insertState([{ id: 1 }, { id: 2 }]);
    await insertTheses([{ id: 1, year: 2020 }, { id: 2, year: 2021 }]);
    const meili = fakeMeili({ 2020: [1], 2021: [2] });

    const result = await reconcileProjections({ clickhouse: ch, meili, scan });

    assert.equal(result.missingInMeili, 0);
    assert.deepEqual(await scan.due(10), []);
  });

  test("ids the backfill cursor passed without recording are swept onto the refresh path", async () => {
    await insertState([{ id: 1 }, { id: 2 }, { id: 4 }]);
    await scan.raiseWatermark("backfill", 6); // cursor says 1..5 were handed out
    await scan.flush();

    const result = await reconcileProjections({ clickhouse: ch, scan });

    // Ids 1, 2, 4 are recorded ok but have no theses rows — they are "missing in
    // clickhouse" here; the sweep result is only about never-recorded ids.
    assert.equal(result.unscanned, 2);
    const due = await scan.due(10);
    assert.ok(due.includes(3) && due.includes(5), "3 and 5 were never scanned");
  });

  test("a held id the last crawl found as a gap is removed from both targets", async () => {
    await insertState([{ id: 1 }, { id: 2, state: "gap" }]);
    await insertTheses([{ id: 1, year: 2020 }, { id: 2, year: 2020 }]);
    const idsByYear = { 2020: [1, 2] };

    const result = await reconcileProjections({ clickhouse: ch, meili: fakeMeili(idsByYear), scan });

    assert.equal(result.removed, 1);
    assert.equal(result.missingInMeili, 0, "removed from both, so no drift");
    assert.deepEqual(idsByYear, { 2020: [1] });
    const held = await ch.query({ query: "SELECT id FROM theses FINAL", format: "JSONEachRow" });
    assert.deepEqual((await held.json<{ id: number }>()).map((r) => Number(r.id)), [1]);
  });

  test("a healthy system reconciles to zero and re-queues nothing", async () => {
    await insertState([{ id: 1 }]);
    await insertTheses([{ id: 1, year: 2020 }]);
    await scan.raiseWatermark("backfill", 2);
    await scan.flush();
    const meili = fakeMeili({ 2020: [1] });

    const result = await reconcileProjections({ clickhouse: ch, meili, scan });

    assert.deepEqual(result, { removed: 0, missingInClickhouse: 0, missingInMeili: 0, unscanned: 0 });
    assert.deepEqual(await scan.due(10), []);
  });
});
