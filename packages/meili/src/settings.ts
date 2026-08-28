import type { MeiliSearch } from "meilisearch";
import { INDEXES, INDEX_NAMES, type IndexName } from "./indexes.ts";

/**
 * The client waits 5s for a task, polling every 50ms. A settings change on an index that
 * already holds documents forces a reindex — minutes on a million theses — so the default
 * reports a timeout for a migration that is in fact still running fine, and the caller
 * cannot tell that from a real failure. Wait as long as a reindex plausibly takes, and
 * poll slowly: nothing here is latency-sensitive.
 */
const TASK_TIMEOUT_MS = 60 * 60_000;
const TASK_POLL_MS = 1_000;

/**
 * Apply index settings declaratively. Deliberately a separate migration step: the old
 * pipeline re-pushed settings on every data load, which makes every ingest a schema
 * change and costs a full reindex each time.
 */
export async function applySettings(
  client: MeiliSearch,
  opts: {
    waitForTasks?: boolean;
    only?: readonly IndexName[];
    taskTimeoutMs?: number;
    /** Where progress goes; a reindex is long enough that silence looks like a hang. */
    log?: (message: string) => void;
  } = {},
): Promise<IndexName[]> {
  const applied: IndexName[] = [];
  const targets = opts.only ?? INDEX_NAMES;
  const wait = (taskUid: number) =>
    client.waitForTask(taskUid, {
      timeOutMs: opts.taskTimeoutMs ?? TASK_TIMEOUT_MS,
      intervalMs: TASK_POLL_MS,
    });

  for (const name of targets) {
    const def = INDEXES[name];
    try {
      const task = await client.createIndex(name, { primaryKey: "id" });
      if (opts.waitForTasks) await wait(task.taskUid);
    } catch {
      // index_already_exists is the normal path on every run after the first
    }

    const index = client.index(name);
    const task = await index.updateSettings({
      ...(def.filterable ? { filterableAttributes: def.filterable } : {}),
      ...(def.sortable ? { sortableAttributes: def.sortable } : {}),
      ...(def.searchable ? { searchableAttributes: def.searchable } : {}),
      ...(def.proximityPrecision ? { proximityPrecision: def.proximityPrecision } : {}),
      pagination: { maxTotalHits: def.maxTotalHits },
    });
    if (opts.waitForTasks) {
      const started = Date.now();
      opts.log?.(`meili: applying settings to ${name}, this reindexes the index`);
      await wait(task.taskUid);
      opts.log?.(`meili: ${name} settled in ${Math.round((Date.now() - started) / 1000)}s`);
    }
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
  /** Null when this index declares none, so Meili's `byWord` default is left alone. */
  proximityPrecision: { expected: string; actual: string | undefined } | null;
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
        proximityPrecision: def.proximityPrecision
          ? { expected: def.proximityPrecision, actual: undefined }
          : null,
      });
      continue;
    }

    const settings = await client.index(name).getSettings();

    const filterable = new Set(settings.filterableAttributes ?? []);
    const sortable = new Set(settings.sortableAttributes ?? []);
    const actual = settings.pagination?.maxTotalHits;

    const missingFilterable = (def.filterable ?? []).filter((a) => !filterable.has(a));
    const missingSortable = (def.sortable ?? []).filter((a) => !sortable.has(a));

    const actualProximity = settings.proximityPrecision;
    const proximityDrifted =
      def.proximityPrecision !== undefined && actualProximity !== def.proximityPrecision;

    const actualSearchable = settings.searchableAttributes ?? ["*"];
    const searchableDrifted =
      def.searchable !== undefined &&
      JSON.stringify(actualSearchable) !== JSON.stringify(def.searchable);

    if (
      missingFilterable.length || missingSortable.length ||
      searchableDrifted || proximityDrifted || actual !== def.maxTotalHits
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
        proximityPrecision: proximityDrifted
          ? { expected: def.proximityPrecision!, actual: actualProximity }
          : null,
      });
    }
  }

  return drift;
}
