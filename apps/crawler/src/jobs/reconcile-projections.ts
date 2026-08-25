import type { ClickHouseClient } from "@tezara/clickhouse";
import type { MeiliSearch } from "@tezara/meili";
import type { ChScanStore } from "../state/ch-scan.ts";

export type ReconcileProjectionsResult = {
  /** Ids marked ok in crawl_state that ClickHouse's theses table does not hold. */
  missingInClickhouse: number;
  /** Ids ClickHouse holds for a drifting year that Meili does not. */
  missingInMeili: number;
  /** Ids below the backfill cursor that were never recorded at all. */
  unscanned: number;
};

/** Bound one run's repair work; anything beyond this is caught by the next run. */
const MAX_REQUEUE = 20_000;

/**
 * Make projection loss self-healing.
 *
 * The scan marks are durable (ClickHouse) but the outbox buffer is not (Redis), so a
 * crash can leave an id marked `ok` whose document never reached a target. Quarantined
 * documents and failed Meili tasks leave the same shape. Nothing inside the normal flow
 * ever goes back for those — this job does, by re-marking them due with an emptied
 * content hash, which forces the refresh to push them again.
 *
 * Everything here is a set comparison against what the targets actually hold; the only
 * writes are crawl_state rows. Run it only when the outboxes are drained, or work that
 * is merely in flight would be counted as missing.
 */
export async function reconcileProjections(
  deps: {
    clickhouse: ClickHouseClient;
    meili?: MeiliSearch;
    scan: ChScanStore;
    log?: (message: string) => void;
    now?: () => number;
  },
  opts: { maxRequeue?: number } = {},
): Promise<ReconcileProjectionsResult> {
  const now = deps.now?.() ?? Date.now();
  const maxRequeue = opts.maxRequeue ?? MAX_REQUEUE;
  const log = deps.log ?? (() => {});
  const result: ReconcileProjectionsResult = {
    missingInClickhouse: 0,
    missingInMeili: 0,
    unscanned: 0,
  };

  const count = async (query: string, params: Record<string, unknown> = {}) => {
    const res = await deps.clickhouse.query({
      query, query_params: params, format: "JSONEachRow",
    });
    return Number((await res.json<{ c: string }>())[0]?.c ?? 0);
  };

  // 1. Marked ok but absent from ClickHouse. Repaired ClickHouse-side in one statement:
  //    re-inserting the state row with next_check_at = now and no content hash makes the
  //    refresh re-crawl and re-push it — to every target, which is idempotent.
  const missingCh =
    "FROM crawl_state FINAL WHERE state = 'ok' AND id NOT IN (SELECT id FROM theses)";
  result.missingInClickhouse = await count(`SELECT count() AS c ${missingCh}`);
  if (result.missingInClickhouse > 0) {
    log(`projection reconcile: ${result.missingInClickhouse} ok id(s) missing from clickhouse`);
    await deps.clickhouse.command({
      query: `
        INSERT INTO crawl_state (id, state, last_checked, next_check_at, attempts, content_hash)
        SELECT id, state, last_checked, {now:UInt64}, attempts, ''
        ${missingCh} LIMIT {limit:UInt32}`,
      query_params: { now, limit: maxRequeue },
    });
  }

  // 2. ClickHouse holds it, Meili does not. Compared per year via Meili's facet counts
  //    (one request), then id-by-id only for years that actually drift. ClickHouse is a
  //    fair reference here: an id missing from BOTH targets was already handled above.
  if (deps.meili) {
    const chYears = await deps.clickhouse.query({
      query: "SELECT year, uniqExact(id) AS c FROM theses FINAL GROUP BY year",
      format: "JSONEachRow",
    });
    const chByYear = new Map(
      (await chYears.json<{ year: number; c: string }>()).map((r) => [Number(r.year), Number(r.c)]),
    );

    const index = deps.meili.index("theses");
    const facets = await index.search("", { limit: 0, facets: ["year"] });
    const meiliByYear = new Map(
      Object.entries(facets.facetDistribution?.year ?? {}).map(([y, c]) => [Number(y), c]),
    );

    for (const [year, chCount] of chByYear) {
      if ((meiliByYear.get(year) ?? 0) >= chCount) continue;
      if (result.missingInMeili >= maxRequeue) break;

      // Enumerate Meili's ids for the drifting year and diff against ClickHouse's.
      const meiliIds = new Set<number>();
      for (let page = 1; ; page++) {
        const res = await index.search("", {
          filter: `year = ${year}`,
          attributesToRetrieve: ["id"],
          hitsPerPage: 1000,
          page,
        });
        for (const hit of res.hits) meiliIds.add(Number((hit as { id: number }).id));
        if (page >= (res.totalPages ?? 1)) break;
      }

      const chIds = await deps.clickhouse.query({
        query: "SELECT DISTINCT id FROM theses WHERE year = {year:UInt32}",
        query_params: { year },
        format: "JSONEachRow",
      });
      const missing = (await chIds.json<{ id: number }>())
        .map((r) => Number(r.id))
        .filter((id) => !meiliIds.has(id))
        .slice(0, maxRequeue - result.missingInMeili);

      if (missing.length > 0) {
        log(`projection reconcile: year ${year} missing ${missing.length} id(s) in meili`);
        await deps.clickhouse.command({
          query: `
            INSERT INTO crawl_state (id, state, last_checked, next_check_at, attempts, content_hash)
            SELECT id, state, last_checked, {now:UInt64}, attempts, ''
            FROM crawl_state FINAL WHERE id IN {ids:Array(UInt32)}`,
          query_params: { now, ids: missing },
        });
        result.missingInMeili += missing.length;
      }
    }
  }

  // 3. Ids below the backfill cursor that were never recorded — a unit that died after
  //    the cursor advanced past it. Synthetic error rows put them on the refresh path
  //    without ever moving the (monotonic) cursor backwards.
  const cursor = (await deps.scan.watermark("backfill")) ?? 1;
  if (cursor > 1) {
    const unscanned =
      "FROM numbers(1, {cursor:UInt32}) AS n WHERE n.number NOT IN (SELECT id FROM crawl_state)";
    result.unscanned = await count(
      `SELECT count() AS c ${unscanned}`, { cursor: cursor - 1 },
    );
    if (result.unscanned > 0) {
      log(`projection reconcile: ${result.unscanned} unscanned id(s) below backfill cursor`);
      await deps.clickhouse.command({
        query: `
          INSERT INTO crawl_state (id, state, last_checked, next_check_at, attempts, content_hash)
          SELECT n.number, 'error', {now:UInt64}, {now:UInt64}, 0, ''
          ${unscanned} LIMIT {limit:UInt32}`,
        query_params: { now, cursor: cursor - 1, limit: maxRequeue },
      });
    }
  }

  return result;
}
