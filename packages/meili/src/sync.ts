import type { TCrawledThesis } from "@tezara/core";
import { MeiliSearchApiError, type MeiliSearch } from "meilisearch";
import { INDEXES, INDEX_NAMES, type IndexDoc, type IndexName } from "./indexes.ts";

export type SyncReport = Record<IndexName, number>;

/**
 * The client defaults to waiting 5s for a task and polling every 50ms. Meili takes tens
 * of seconds to index a thousand theses, so the default times the push out after it has
 * already been accepted: the batch is never committed, the outbox never drains, and the
 * same thousand documents are re-pushed forever.
 */
const TASK_TIMEOUT_MS = 10 * 60_000;
const TASK_POLL_MS = 500;

/** A task Meili accepted and then failed to process. */
export class TaskFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskFailedError";
  }
}

export type Rejection = {
  index: IndexName;
  /** The documents Meili refused. Dropped ones are worth keeping; the rest are retried. */
  docs: IndexDoc[];
  reason: string;
  /** What we serialized, to compare against the offset Meili reports. */
  payloadBytes: number;
  /**
   * The bytes our own payload holds at the offset in Meili's message. A mismatch —
   * an offset past the end of the payload, or one that is not a document boundary —
   * means the body Meili parsed is not the body we sent.
   */
  atOffset: { column: number; excerpt: string } | null;
  /** True when the batch was a single document and it was given up on. */
  dropped: boolean;
};

export type SyncOptions = {
  waitForTasks?: boolean;
  taskTimeoutMs?: number;
  /**
   * Called for every push Meili refuses. Supplying it turns a refusal into a bisect:
   * the batch is halved until the offending document is alone, which is then reported
   * with `dropped` and skipped. Without it a refusal throws, which is what a caller
   * that cannot quarantine anything wants.
   */
  onReject?: (rejection: Rejection) => void | Promise<void>;
};

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * The message when Meili refused the *content* of a push, or null for anything else.
 *
 * Deliberately narrow: 401, 404 and 429 are about the request, not the documents, and
 * bisecting on those would quarantine a whole batch over an expired key.
 */
function refusalReason(err: unknown): string | null {
  if (err instanceof TaskFailedError) return err.message;
  if (err instanceof MeiliSearchApiError && [400, 413].includes(err.response.status)) {
    return err.message;
  }
  return null;
}

function offsetContext(payload: Buffer, reason: string): Rejection["atOffset"] {
  const match = /column (\d+)/.exec(reason);
  if (!match) return null;
  const column = Number(match[1]);
  if (column > payload.byteLength) return { column, excerpt: "<past end of payload>" };
  const from = Math.max(0, column - 41);
  return { column, excerpt: payload.subarray(from, column + 19).toString("utf8") };
}

/** Push one chunk, halving it until Meili accepts it or a single document is to blame. */
async function push(
  client: MeiliSearch,
  name: IndexName,
  docs: IndexDoc[],
  opts: SyncOptions,
): Promise<number> {
  const index = client.index(name);
  try {
    const task = await index.addDocuments(docs, { primaryKey: "id" });
    if (opts.waitForTasks) {
      const done = await index.waitForTask(task.taskUid, {
        timeOutMs: opts.taskTimeoutMs ?? TASK_TIMEOUT_MS,
        intervalMs: TASK_POLL_MS,
      });
      // A failed task used to pass silently: the batch was committed and its theses
      // were dropped without ever reaching the index.
      if (done.status === "failed") {
        throw new TaskFailedError(done.error?.message ?? `task ${task.taskUid} failed`);
      }
    }
    return docs.length;
  } catch (err) {
    const reason = refusalReason(err);
    if (reason === null || !opts.onReject) throw err;

    const payload = Buffer.from(JSON.stringify(docs), "utf8");
    await opts.onReject({
      index: name,
      docs,
      reason,
      payloadBytes: payload.byteLength,
      atOffset: offsetContext(payload, reason),
      dropped: docs.length === 1,
    });
    if (docs.length === 1) return 0;

    const mid = Math.ceil(docs.length / 2);
    return (
      (await push(client, name, docs.slice(0, mid), opts)) +
      (await push(client, name, docs.slice(mid), opts))
    );
  }
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
  opts: SyncOptions = {},
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

    for (const batch of chunk([...byId.values()], def.batchSize)) {
      report[name] += await push(client, name, batch, opts);
    }
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
  opts: { waitForTasks?: boolean; taskTimeoutMs?: number } = {},
): Promise<number> {
  if (ids.length === 0) return 0;
  const index = client.index("theses");
  const task = await index.deleteDocuments([...ids]);
  if (opts.waitForTasks) {
    await index.waitForTask(task.taskUid, {
      timeOutMs: opts.taskTimeoutMs ?? TASK_TIMEOUT_MS,
      intervalMs: TASK_POLL_MS,
    });
  }
  return ids.length;
}
