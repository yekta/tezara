import type { MeiliSearch } from "@tezara/meili";
import type { ChScanStore } from "../state/ch-scan.ts";

/**
 * Theses indexed without their list metadata (year, author, type, language). Recorded as
 * errors so they are re-crawled within minutes, and the fresh record overwrites them.
 */
export async function requeueIncompleteTheses(deps: { meili: MeiliSearch; scan: ChScanStore }): Promise<number[]> {
  const res = await deps.meili.index("theses").search("", {
    filter: "year IS NULL",
    limit: 1000,
    attributesToRetrieve: ["id"],
  });
  const ids = res.hits.map((hit) => Number(hit.id));
  for (const id of ids) deps.scan.record(id, "error");
  await deps.scan.flush();
  return ids;
}
