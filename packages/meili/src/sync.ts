import type { TCrawledThesis } from "@tezara/core";
import type { MeiliSearch } from "meilisearch";
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
  readonly code: string | undefined;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "TaskFailedError";
    this.code = code;
  }
}

/**
 * Meili error codes that are genuinely the document's fault.
 *
 * Only these are ever grounds for giving up on a record. Everything else Meili can
 * refuse a push for — a malformed payload, a full disk — says nothing about the
 * documents, and dropping perfectly good theses because the server ran out of space
 * would turn an outage into permanent data loss.
 */
const DOCUMENT_IS_TO_BLAME = new Set([
  "invalid_document_id",
  "missing_document_id",
  "invalid_document_fields",
  "invalid_document_geo_field",
  "document_fields_limit_reached",
]);

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

type Refusal = {
  reason: string;
  /** The record itself is wrong, so isolating it and dropping it is the fix. */
  blamesDocument: boolean;
  /** A smaller batch could succeed, so halving is worth the requests. */
  worthSplitting: boolean;
};

/**
 * How Meili refused this push, or null if it did not refuse it at all.
 *
 * Deliberately narrow: 401, 404, 429 and 422 are about the request or the server, not
 * the documents. A full disk arrives as 422 `no_space_left_on_device` — retrying that
 * in ever-smaller batches would accomplish nothing and quarantining on it would be a
 * catastrophe, so it stays an ordinary job failure and the outbox holds the line.
 *
 * Matched on shape rather than `instanceof MeiliSearchApiError`. In production a refusal
 * reached the worker as a plain job failure instead of being bisected out, which means
 * the class check did not hold — the client ships ESM, CJS and UMD builds, and an error
 * raised through one is not an instance of another's class. Shape cannot go wrong that
 * way.
 */
function refusal(err: unknown): Refusal | null {
  if (!(err instanceof Error)) return null;

  if (err.name === "TaskFailedError") {
    const blamesDocument = DOCUMENT_IS_TO_BLAME.has((err as TaskFailedError).code ?? "");
    return { reason: err.message, blamesDocument, worthSplitting: blamesDocument };
  }

  const status = (err as { response?: { status?: unknown } }).response?.status;
  if (typeof status !== "number" || ![400, 413].includes(status)) return null;

  const code = (err as { cause?: { code?: unknown } }).cause?.code;
  const blamesDocument = typeof code === "string" && DOCUMENT_IS_TO_BLAME.has(code);
  return {
    reason: err.message,
    blamesDocument,
    // 413 means the batch was too big for Meili's payload limit, which halving fixes.
    // `malformed_payload` does NOT belong here: Meili answers a full disk with it (the
    // upload it streams to its own volume is what fails to parse), so splitting on it
    // costs a thousand futile requests and proves nothing.
    worthSplitting: blamesDocument || status === 413,
  };
}

function offsetContext(payload: Buffer, reason: string): Rejection["atOffset"] {
  const match = /column (\d+)/.exec(reason);
  if (!match) return null;
  const column = Number(match[1]);
  if (column > payload.byteLength) return { column, excerpt: "<past end of payload>" };
  const from = Math.max(0, column - 41);
  return { column, excerpt: payload.subarray(from, column + 19).toString("utf8") };
}

/**
 * Errors already carrying payload context, so a bisect does not append it once per
 * level on the way back up.
 */
const annotated = new WeakSet<Error>();

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
        throw new TaskFailedError(
          done.error?.message ?? `task ${task.taskUid} failed`,
          done.error?.code,
        );
      }
    }
    return docs.length;
  } catch (err) {
    const refused = refusal(err);
    const payload = Buffer.from(JSON.stringify(docs), "utf8");

    // Say what we sent, whatever the failure turns out to be. An offset in a parse error
    // means nothing without the size of the payload it refers to, and this is the only
    // place that still knows it.
    const annotate = (e: unknown): unknown => {
      if (e instanceof Error && !annotated.has(e)) {
        annotated.add(e);
        e.message = `${e.message} [${name}: ${docs.length} docs, ${payload.byteLength} byte payload]`;
      }
      return e;
    };

    // A refusal that is not about the documents is a symptom, not poison: fail the job,
    // leave the outbox intact, and let the operator fix the server.
    if (refused === null || !refused.worthSplitting || !opts.onReject) throw annotate(err);
    if (docs.length === 1 && !refused.blamesDocument) throw annotate(err);

    await opts.onReject({
      index: name,
      docs,
      reason: refused.reason,
      payloadBytes: payload.byteLength,
      atOffset: offsetContext(payload, refused.reason),
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
