import type { MeiliSearch } from "meilisearch";
import { INDEXES, INDEX_NAMES, type IndexName } from "./indexes.ts";

/**
 * Apply index settings declaratively. Deliberately a separate migration step: the old
 * pipeline re-pushed settings on every data load, which makes every ingest a schema
 * change and costs a full reindex each time.
 */
export async function applySettings(
  client: MeiliSearch,
  opts: { waitForTasks?: boolean; only?: readonly IndexName[] } = {},
): Promise<IndexName[]> {
  const applied: IndexName[] = [];
  const targets = opts.only ?? INDEX_NAMES;

  for (const name of targets) {
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
      ...(def.searchable ? { searchableAttributes: def.searchable } : {}),
      pagination: { maxTotalHits: def.maxTotalHits },
    });
    if (opts.waitForTasks) await index.waitForTask(task.taskUid);
    applied.push(name);
  }

  return applied;
}

export type SettingsDrift = {
  index: IndexName;
  /** The index does not exist at all — creating it is safe and needs no operator. */
  missing: boolean;
  missingFilterable: string[];
  missingSortable: string[];
  /**
   * Order-sensitive: searchable order IS the attribute ranking, so a reordering is
   * drift even when the set is identical. Null when this index declares none (its
   * documents are name-only, so Meili's `["*"]` default is already right).
   */
  searchable: { expected: string[]; actual: string[] } | null;
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

  // One listing rather than a settings GET per index: against a fresh instance the
  // latter is eleven 404s in the server's log every time a sync job runs, which buries
  // whatever actually went wrong. A failure to list is left to propagate — "Meili is
  // unreachable" is a truer answer than "nothing is migrated".
  const { results } = await client.getIndexes({ limit: INDEX_NAMES.length + 100 });
  const existing = new Set(results.map((index) => index.uid));

  for (const name of INDEX_NAMES) {
    const def = INDEXES[name];

    if (!existing.has(name)) {
      drift.push({
        index: name,
        missing: true,
        missingFilterable: def.filterable ?? [],
        missingSortable: def.sortable ?? [],
        searchable: def.searchable ? { expected: def.searchable, actual: [] } : null,
        maxTotalHits: { expected: def.maxTotalHits, actual: undefined },
      });
      continue;
    }

    const settings = await client.index(name).getSettings();

    const filterable = new Set(settings.filterableAttributes ?? []);
    const sortable = new Set(settings.sortableAttributes ?? []);
    const actual = settings.pagination?.maxTotalHits;

    const missingFilterable = (def.filterable ?? []).filter((a) => !filterable.has(a));
    const missingSortable = (def.sortable ?? []).filter((a) => !sortable.has(a));

    const actualSearchable = settings.searchableAttributes ?? ["*"];
    const searchableDrifted =
      def.searchable !== undefined &&
      JSON.stringify(actualSearchable) !== JSON.stringify(def.searchable);

    if (
      missingFilterable.length || missingSortable.length ||
      searchableDrifted || actual !== def.maxTotalHits
    ) {
      drift.push({
        index: name,
        missing: false,
        missingFilterable,
        missingSortable,
        searchable: searchableDrifted
          ? { expected: def.searchable!, actual: actualSearchable }
          : null,
        maxTotalHits: { expected: def.maxTotalHits, actual },
      });
    }
  }

  return drift;
}
