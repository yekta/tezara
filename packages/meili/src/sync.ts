import type { TCrawledThesis } from "@tezara/core";
import type { MeiliSearch } from "meilisearch";
import { INDEXES, INDEX_NAMES, type IndexDoc, type IndexName } from "./indexes.ts";

export type SyncReport = Record<IndexName, number>;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Push a batch of theses into every index derived from them.
 *
 * Incremental by design: only the documents handed in are touched, so a refresh that
 * finds nothing changed costs nothing. The old pipeline loaded the entire corpus into
 * memory and re-pushed all of it, which is why it needed a 16GB heap.
 *
 * Dimension documents are keyed by md5(name), so re-deriving the same university from a
 * thousand theses is an idempotent upsert rather than a duplicate.
 */
export async function syncTheses(
  client: MeiliSearch,
  theses: readonly TCrawledThesis[],
  opts: { waitForTasks?: boolean } = {},
): Promise<SyncReport> {
  const report = Object.fromEntries(INDEX_NAMES.map((n) => [n, 0])) as SyncReport;
  if (theses.length === 0) return report;

  for (const name of INDEX_NAMES) {
    const def = INDEXES[name];
    const byId = new Map<string, IndexDoc>();

    for (const thesis of theses) {
      const derived = def.derive(thesis);
      if (!derived) continue;
      for (const doc of Array.isArray(derived) ? derived : [derived]) {
        byId.set(String(doc.id), doc);
      }
    }
    if (byId.size === 0) continue;

    const index = client.index(name);
    for (const batch of chunk([...byId.values()], def.batchSize)) {
      const task = await index.addDocuments(batch, { primaryKey: "id" });
      if (opts.waitForTasks) await index.waitForTask(task.taskUid);
    }
    report[name] = byId.size;
  }

  return report;
}

/**
 * Remove theses that no longer exist upstream.
 *
 * Only the `theses` index is touched: dimension indexes are shared across records, so a
 * name cannot be deleted just because one thesis using it went away. Pruning those needs
 * a full rebuild, which is cheap and belongs in a periodic job rather than here.
 */
export async function deleteTheses(
  client: MeiliSearch,
  ids: readonly number[],
  opts: { waitForTasks?: boolean } = {},
): Promise<number> {
  if (ids.length === 0) return 0;
  const index = client.index("theses");
  const task = await index.deleteDocuments([...ids]);
  if (opts.waitForTasks) await index.waitForTask(task.taskUid);
  return ids.length;
}
