import type { MeiliSearch } from "meilisearch";
import type { IndexName } from "./indexes.ts";

/**
 * Compaction rewrites the index into a fresh, densely packed file and swaps it in, so it
 * runs for as long as a full copy takes — 19 minutes on a million theses. The client's
 * 5s default would report a timeout for a task that is still running fine.
 */
const TASK_TIMEOUT_MS = 2 * 60 * 60_000;
const TASK_POLL_MS = 2_000;

export type Usage = {
  /** What the database file occupies on disk. */
  fileBytes: number;
  /** What is actually live inside it. */
  liveBytes: number;
  /**
   * fileBytes / liveBytes. LMDB grows its file and never shrinks it: pages freed by an
   * update stay in the file as reusable space, so this only ever rises until something
   * compacts. 1.0 is perfectly dense; this index reached 4.05 (78.4GB holding 19.4GB)
   * after a run of whole-corpus reindexes.
   */
  ratio: number;
  /** Documents in the named index, for cadence decisions. */
  documents: number;
};

type StatsResponse = {
  databaseSize?: number;
  usedDatabaseSize?: number;
  indexes?: Record<string, { numberOfDocuments?: number }>;
};

/**
 * Read disk usage. `usedDatabaseSize` is newer than the pinned client's `Stats` type,
 * so this goes through the raw request rather than `client.getStats()`.
 */
export async function readUsage(client: MeiliSearch, index: IndexName): Promise<Usage> {
  const stats = await client.httpRequest.get<StatsResponse>("stats");
  const fileBytes = stats.databaseSize ?? 0;
  const liveBytes = stats.usedDatabaseSize ?? 0;
  return {
    fileBytes,
    liveBytes,
    // A brand new instance reports zero live bytes; call that dense rather than divide.
    ratio: liveBytes > 0 ? fileBytes / liveBytes : 1,
    documents: stats.indexes?.[index]?.numberOfDocuments ?? 0,
  };
}

export type CompactionReport = {
  index: IndexName;
  before: Usage;
  after: Usage;
  /** Bytes handed back to the filesystem. */
  reclaimedBytes: number;
  durationMs: number;
};

/**
 * Defragment one index (`POST /indexes/:uid/compact`, Meili >= 1.23).
 *
 * Copy-then-swap, so it needs free space for the compacted copy alongside the original —
 * roughly the live size. Running out mid-way fails the task with `no_space_left_on_device`
 * and leaves the original untouched, which is why this is safe to attempt: a failure
 * costs time, not data.
 */
export async function compactIndex(
  client: MeiliSearch,
  index: IndexName,
  opts: { taskTimeoutMs?: number; log?: (message: string) => void } = {},
): Promise<CompactionReport> {
  const log = opts.log ?? (() => {});
  const before = await readUsage(client, index);
  const startedAt = Date.now();

  log(
    `meili: compacting ${index} — file ${gb(before.fileBytes)} holding ` +
      `${gb(before.liveBytes)} (${before.ratio.toFixed(2)}x)`,
  );

  const task = await client.httpRequest.post(`indexes/${index}/compact`);
  const settled = await client.waitForTask(task.taskUid, {
    timeOutMs: opts.taskTimeoutMs ?? TASK_TIMEOUT_MS,
    intervalMs: TASK_POLL_MS,
  });
  if (settled.status !== "succeeded") {
    throw new Error(
      `meili: compacting ${index} ${settled.status}: ${settled.error?.message ?? "no error given"}`,
    );
  }

  const after = await readUsage(client, index);
  const durationMs = Date.now() - startedAt;
  log(
    `meili: compacted ${index} in ${Math.round(durationMs / 1000)}s — file ` +
      `${gb(before.fileBytes)} -> ${gb(after.fileBytes)} (${after.ratio.toFixed(2)}x)`,
  );

  return {
    index,
    before,
    after,
    reclaimedBytes: before.fileBytes - after.fileBytes,
    durationMs,
  };
}

const gb = (bytes: number) => `${(bytes / 1e9).toFixed(2)}GB`;
