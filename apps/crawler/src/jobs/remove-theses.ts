import { deleteTheses as deleteFromClickhouse, type ClickHouseClient } from "@tezara/clickhouse";
import { currentYear, isTrialThesis, placeholderTitles } from "@tezara/core";
import { deleteTheses as deleteFromMeili, type MeiliSearch } from "@tezara/meili";
import type { ChScanStore } from "../state/ch-scan.ts";
import { DIRTY_MARK } from "./sync-clickhouse.ts";

type Targets = { meili?: MeiliSearch; clickhouse?: ClickHouseClient; scan: ChScanStore };

/**
 * Take theses out of both projections. Meili goes first: if it fails, ClickHouse still
 * holds the ids, so the projection reconcile finds them again.
 */
export async function removeTheses(deps: Targets, ids: readonly number[]): Promise<void> {
  if (ids.length === 0) return;
  if (deps.meili) await deleteFromMeili(deps.meili, ids, { waitForTasks: true });
  if (!deps.clickhouse) return;
  await deleteFromClickhouse(deps.clickhouse, ids);
  await deps.scan.raiseWatermark(DIRTY_MARK, Date.now());
}

/** Exact placeholder titles rank first in Meili, so a short page per search is enough. */
const SWEEP_PAGE = 100;

type SweepHit = { id: number; title_original: string; year: number | null };

/**
 * Remove trial theses that were indexed before the ingest check existed, or before a
 * placeholder title was added to it. They are recorded as gaps, so they are re-checked
 * on the gap schedule rather than dropped for good.
 */
export async function sweepTrialTheses(deps: Targets & { meili: MeiliSearch }): Promise<number[]> {
  const index = deps.meili.index("theses");
  const attributesToRetrieve = ["id", "title_original", "year"];
  const searches: [string, Record<string, unknown>][] = [
    ["", { filter: `year > ${currentYear()}` }],
    ...placeholderTitles.map((title): [string, Record<string, unknown>] => [
      title,
      { attributesToSearchOn: ["title_original"], matchingStrategy: "all" },
    ]),
  ];

  const ids = new Set<number>();
  for (const [q, opts] of searches) {
    const res = await index.search(q, { ...opts, limit: SWEEP_PAGE, attributesToRetrieve });
    for (const hit of res.hits as unknown as SweepHit[]) {
      if (isTrialThesis(hit)) ids.add(hit.id);
    }
  }

  await removeTheses(deps, [...ids]);
  for (const id of ids) deps.scan.record(id, "gap");
  await deps.scan.flush();
  return [...ids];
}
