import type { MeiliSearch } from "meilisearch";
import { INDEXES, INDEX_NAMES, type IndexName } from "./indexes.ts";

/**
 * Apply index settings declaratively. Deliberately a separate migration step: the old
 * pipeline re-pushed settings on every data load, which makes every ingest a schema
 * change and costs a full reindex each time.
 */
export async function applySettings(
  client: MeiliSearch,
  opts: { waitForTasks?: boolean } = {},
): Promise<IndexName[]> {
  const applied: IndexName[] = [];

  for (const name of INDEX_NAMES) {
    const def = INDEXES[name];
    try {
      const task = await client.createIndex(name, { primaryKey: "id" });
      if (opts.waitForTasks) await client.waitForTask(task.taskUid);
    } catch {
      // index_already_exists is the normal path on every run after the first
    }

    const index = client.index(name);
    const task = await index.updateSettings({
      ...(def.filterable ? { filterableAttributes: def.filterable } : {}),
      ...(def.sortable ? { sortableAttributes: def.sortable } : {}),
      pagination: { maxTotalHits: def.maxTotalHits },
    });
    if (opts.waitForTasks) await index.waitForTask(task.taskUid);
    applied.push(name);
  }

  return applied;
}

export type SettingsDrift = {
  index: IndexName;
  missingFilterable: string[];
  missingSortable: string[];
  maxTotalHits: { expected: number; actual: number | null | undefined };
};

/**
 * Verify the live settings match the declarative definitions.
 *
 * This exists because the failure mode is silent: `addDocuments` auto-creates a missing
 * index with Meili's defaults (no filterable attributes, maxTotalHits 1000), so a sync
 * that runs before the migration leaves every filter the web app uses returning nothing,
 * with no error anywhere. Run this after migrating and on startup.
 */
export async function verifySettings(client: MeiliSearch): Promise<SettingsDrift[]> {
  const drift: SettingsDrift[] = [];

  for (const name of INDEX_NAMES) {
    const def = INDEXES[name];
    let settings;
    try {
      settings = await client.index(name).getSettings();
    } catch {
      drift.push({
        index: name,
        missingFilterable: def.filterable ?? [],
        missingSortable: def.sortable ?? [],
        maxTotalHits: { expected: def.maxTotalHits, actual: undefined },
      });
      continue;
    }

    const filterable = new Set(settings.filterableAttributes ?? []);
    const sortable = new Set(settings.sortableAttributes ?? []);
    const actual = settings.pagination?.maxTotalHits;

    const missingFilterable = (def.filterable ?? []).filter((a) => !filterable.has(a));
    const missingSortable = (def.sortable ?? []).filter((a) => !sortable.has(a));

    if (missingFilterable.length || missingSortable.length || actual !== def.maxTotalHits) {
      drift.push({
        index: name,
        missingFilterable,
        missingSortable,
        maxTotalHits: { expected: def.maxTotalHits, actual },
      });
    }
  }

  return drift;
}
