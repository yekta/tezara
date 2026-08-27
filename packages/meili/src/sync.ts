import type { TCrawledThesis } from "@tezara/core";
import type { MeiliSearch } from "meilisearch";
import { INDEXES, INDEX_NAMES, type IndexDoc, type IndexName } from "./indexes.ts";

export type SyncReport = Record<IndexName, number>;

/**
 * The client defaults to waiting 5s for a task and polling every 50ms. Meili takes tens
 * of seconds to index a thousand theses, so the default times the push out after it has
 * already been accepted: the batch is never committed, the outbox never drains, and the
 * same thousand documents are re-pushed forever.
 *
 * The poll interval trades wasted requests against wasted latency. Indexing a batch
 * takes minutes, the waits run in parallel, and every in-flight task polls on its own
 * timer — sub-second polling is thousands of status requests per batch against the same
 * instance that is busy indexing, to notice completion a few hundred milliseconds
 * sooner. One second bounds the overhead at one request per task per second and adds at
 * most that second to a wait measured in minutes.
 */
const TASK_TIMEOUT_MS = 10 * 60_000;
const TASK_POLL_MS = 1_000;

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

/**
 * Remembers which saturating-index documents have already reached Meili, so they are
 * pushed once and never again.
 *
 * The dimension indexes are derived from a stream of theses but they are not a stream:
 * there are ~210 universities, five languages, four thesis types and a fixed subject
 * taxonomy. Without this, every batch re-pushes the same names for the life of the
 * crawl — at thesis 900,000 it is still writing "Türkçe" into the languages index — and
 * because each index costs its own awaited task, most of a drain's wall clock is spent
 * telling Meili things it already knows.
 *
 * Ids are opaque here; the crawler backs this with Redis sets so it survives restarts.
 * Only indexes marked `saturates` are consulted, which keeps what has to be remembered
 * to a few thousand ids rather than one per thesis.
 */
export type KnownDocs = {
  /** Of `ids`, the ones not yet recorded as pushed. */
  unseen(index: IndexName, ids: readonly string[]): Promise<ReadonlySet<string>>;
  /** Record ids as pushed. Only ever called after Meili has accepted them. */
  remember(index: IndexName, ids: readonly string[]): Promise<void>;
};

export type SyncOptions = {
  waitForTasks?: boolean;
  taskTimeoutMs?: number;
  /** Where the wait's heartbeat goes; omit it and long waits are silent. */
  log?: (message: string) => void;
  /**
   * Skip documents already known to be indexed. Omit it and every name is pushed in
   * every batch, which is correct but is most of a drain's round trips.
   */
  known?: KnownDocs;
  /**
   * Called for every push Meili refuses. Supplying it turns a refusal into a bisect:
   * the batch is halved until the offending document is alone, which is then reported
   * with `dropped` and skipped. Without it a refusal throws, which is what a caller
   * that cannot quarantine anything wants.
   */
  onReject?: (rejection: Rejection) => void | Promise<void>;
};

/** How often a wait says it is still waiting. */
const WAIT_REPORT_MS = 30_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const n = (value: number) => value.toLocaleString("en-US");

/** True when the server is working on ANY task — ours or another client's. */
async function serverBusy(client: MeiliSearch): Promise<boolean> {
  const busy = await client.getTasks({ statuses: ["processing"], limit: 1 });
  return busy.total > 0;
}

/** Within-pass progress for the heartbeat, best effort — older servers lack /batches. */
async function batchProgress(client: MeiliSearch, batchUid: number | null): Promise<string> {
  if (batchUid === null || batchUid === undefined) return "";
  try {
    const batch = await client.getBatch(batchUid);
    return batch.progress === null ? "" : ` (${Math.round(batch.progress.percentage)}%)`;
  } catch {
    return "";
  }
}

/**
 * The client's waitForTask, replaced with our own poll so the wait can narrate.
 * Indexing a large batch into a large index runs for minutes, and between submission
 * and completion the client's wait produces nothing — an operator watching the log
 * cannot tell a slow indexing pass from a wedged one. A heartbeat every 30s can.
 *
 * There is deliberately no clock on work in flight. An indexing pass legitimately
 * outlives any fixed timeout, and abandoning one wastes exactly the work being waited
 * for: the pass completes server-side uncommitted, and the retry re-submits the same
 * documents for another full pass. A backlog once fed on itself this way — every
 * "timeout" re-queued ten minutes of real indexing. The deadline advances while the
 * task is being processed, or while the server is busy with anything at all (a
 * predecessor, another client's work, a dump); it runs down only when this task sits
 * enqueued against a provably idle server, which is a wedged scheduler and the one
 * case worth giving up on.
 */
async function awaitTask(
  client: MeiliSearch,
  name: string,
  taskUid: number,
  docCount: number,
  opts: SyncOptions,
  unit = "docs",
): Promise<void> {
  const timeoutMs = opts.taskTimeoutMs ?? TASK_TIMEOUT_MS;
  const startedAt = Date.now();
  let nextReport = startedAt + WAIT_REPORT_MS;
  let deadline = startedAt + timeoutMs;

  while (true) {
    const task = await client.getTask(taskUid);
    if (task.status === "succeeded") return;
    // `canceled` used to sail through the old wait as if it had indexed; it has not.
    if (task.status === "failed" || task.status === "canceled") {
      throw new TaskFailedError(
        task.error?.message ?? `task ${taskUid} ${task.status}`,
        task.error?.code,
      );
    }

    const elapsed = Date.now() - startedAt;
    if (task.status === "processing" || (await serverBusy(client))) {
      deadline = Date.now() + timeoutMs;
    } else if (Date.now() >= deadline) {
      throw new Error(
        `gave up on meili task ${taskUid} (${name}, ${n(docCount)} ${unit}) after ` +
          `${Math.round(elapsed / 1000)}s: still enqueued and the server is processing nothing`,
      );
    }
    if (Date.now() >= nextReport) {
      nextReport += WAIT_REPORT_MS;
      const pct =
        task.status === "processing" ? await batchProgress(client, task.batchUid) : "";
      opts.log?.(
        `meili task ${taskUid} (${name}, ${n(docCount)} ${unit}): ` +
          `${task.status} for ${Math.round(elapsed / 1000)}s${pct}`,
      );
    }
    await sleep(TASK_POLL_MS);
  }
}

type Submitted = { name: IndexName; docs: IndexDoc[]; taskUid: number };

/**
 * Wait for every task of one submission, polling the whole set with one request per
 * tick instead of one per task.
 *
 * Same no-clock-on-work-in-flight rule as awaitTask, applied to the set: a submission
 * is up to ten tasks that Meili works through one pass at a time, so most of them
 * spend most of the wait correctly enqueued behind a sibling. The deadline advances
 * while any of ours is processing, any status changed, or the server is busy with
 * anything else; it runs down only when every task sits enqueued against an idle
 * server. Aborting for any lesser reason re-submits documents whose indexing was
 * already underway — the backlog that inspired all of this fed on exactly that.
 */
async function awaitSubmission(
  client: MeiliSearch,
  submitted: readonly Submitted[],
  opts: SyncOptions,
  handle: { onDone: (s: Submitted) => void; onFail: (s: Submitted, err: unknown) => void },
): Promise<void> {
  const timeoutMs = opts.taskTimeoutMs ?? TASK_TIMEOUT_MS;
  const pending = new Map(submitted.map((s) => [s.taskUid, s]));
  const lastSeen = new Map<number, string>();
  let deadline = Date.now() + timeoutMs;
  let nextReport = Date.now() + WAIT_REPORT_MS;

  while (pending.size > 0) {
    const tasks = await client.getTasks({ uids: [...pending.keys()], limit: pending.size });
    let progressed = false;
    const processing: { s: Submitted; task: { startedAt: Date; batchUid: number | null } }[] = [];

    for (const task of tasks.results) {
      const s = pending.get(task.uid);
      if (!s) continue;
      if (lastSeen.get(task.uid) !== task.status) {
        lastSeen.set(task.uid, task.status);
        progressed = true;
      }
      if (task.status === "succeeded") {
        pending.delete(task.uid);
        handle.onDone(s);
      } else if (task.status === "failed" || task.status === "canceled") {
        pending.delete(task.uid);
        handle.onFail(
          s,
          new TaskFailedError(
            task.error?.message ?? `task ${task.uid} ${task.status}`,
            task.error?.code,
          ),
        );
      } else if (task.status === "processing") {
        processing.push({ s, task });
      }
    }
    if (pending.size === 0) return;

    if (progressed || processing.length > 0 || (await serverBusy(client))) {
      deadline = Date.now() + timeoutMs;
    } else if (Date.now() >= deadline) {
      const err = new Error(
        `gave up on ${pending.size} meili task(s) still enqueued after the server ` +
          `processed nothing for ${Math.round(timeoutMs / 1000)}s`,
      );
      for (const s of pending.values()) handle.onFail(s, err);
      return;
    }
    if (Date.now() >= nextReport) {
      nextReport += WAIT_REPORT_MS;
      const lines: string[] = [];
      for (const { s, task } of processing) {
        const age = Math.round((Date.now() - task.startedAt.getTime()) / 1000);
        lines.push(
          `${s.name} ${n(s.docs.length)} docs, processing for ${age}s` +
            `${await batchProgress(client, task.batchUid)}`,
        );
      }
      opts.log?.(
        `meili: ${pending.size} task(s) pending — ` +
          `${lines.length > 0 ? lines.join("; ") : "between passes"}` +
          `${pending.size > processing.length ? `; ${pending.size - processing.length} enqueued` : ""}`,
      );
    }
    await sleep(TASK_POLL_MS);
  }
}

/**
 * Clear the wreckage of interrupted drains before pushing anything new.
 *
 * A wait that times out leaves its submission ENQUEUED: Meili keeps the task, and its
 * multi-MB payload on disk, until it is processed. The drain's retry then pushes the
 * same documents again as a new task behind the stale one and waits on that — a wait
 * that must outlast every predecessor before its own task even starts. Past the point
 * where the queue is longer than one timeout, no drain can ever succeed again, and
 * every attempt adds another payload to the queue and to Meili's disk.
 *
 * Cancelling the stale enqueued additions is lossless by construction: a batch is
 * committed out of the outbox only when its task SUCCEEDS, so every document in a
 * cancelled task is still in the outbox — it is exactly what the caller is about to
 * push again. Only `documentAdditionOrUpdate` is touched; anything else in the queue
 * (settings, deletions, an operator's dump) is not ours to discard.
 *
 * The task already mid-pass is left to finish, and this returns only once it has:
 * cancelling it would waste the indexing work already sunk into it, but pushing behind
 * it would hand the next wait a predecessor again. No timeout on that — the outbox
 * holds the line, nothing here grows, and the heartbeat says what is being waited on.
 */
export async function settleTaskQueue(
  client: MeiliSearch,
  opts: { log?: (message: string) => void } = {},
): Promise<{ canceled: number }> {
  const query = { types: ["documentAdditionOrUpdate" as const] };

  const stale = await client.getTasks({ ...query, statuses: ["enqueued"], limit: 1 });
  if (stale.total > 0) {
    opts.log?.(`meili: cancelling ${n(stale.total)} stale enqueued push(es) from interrupted drains`);
    const cancellation = await client.cancelTasks({ ...query, statuses: ["enqueued"] });
    await awaitTask(client, "task cancellation", cancellation.taskUid, stale.total, opts, "stale tasks");
  }

  let nextReport = Date.now() + WAIT_REPORT_MS;
  while (true) {
    const busy = await client.getTasks({ ...query, statuses: ["processing"], limit: 1 });
    if (busy.total === 0) return { canceled: stale.total };
    const task = busy.results[0]!;
    if (Date.now() >= nextReport) {
      nextReport += WAIT_REPORT_MS;
      const age = Math.round((Date.now() - task.startedAt.getTime()) / 1000);
      opts.log?.(
        `meili task ${task.uid} (${task.indexUid ?? "?"}) from a previous drain: ` +
          `processing for ${age}s${await batchProgress(client, task.batchUid)}, waiting it out`,
      );
    }
    await sleep(TASK_POLL_MS);
  }
}

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

/**
 * A push Meili refused: bisect it out or throw, depending on whose fault it is.
 * Shared by the serial fallback path and the parallel wait in syncTheses.
 */
async function recover(
  client: MeiliSearch,
  name: IndexName,
  docs: IndexDoc[],
  opts: SyncOptions,
  err: unknown,
): Promise<number> {
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
    if (opts.waitForTasks) await awaitTask(client, name, task.taskUid, docs.length, opts);
    return docs.length;
  } catch (err) {
    return recover(client, name, docs, opts, err);
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

  // Submit every chunk of every index BEFORE waiting on anything. Meili's scheduler
  // merges consecutive queued tasks per index into one indexing pass, and a pass has a
  // large fixed cost — so submit-then-wait indexes a batch in roughly one pass per
  // index, where the old submit-wait-submit-wait paid that fixed cost per chunk, one
  // index at a time, with the drain idle in between.
  const submitted: Submitted[] = [];
  const failures: { name: IndexName; docs: IndexDoc[]; err: unknown }[] = [];
  const sentByIndex = new Map<IndexName, string[]>();

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

    // Drop the ones Meili already holds. An index whose names have all been seen before
    // — which, past the first few thousand theses, is every dimension index but the
    // handful with genuinely new authors — now has nothing to push, and the `continue`
    // below skips the task entirely rather than waiting on a write that changes nothing.
    if (def.saturates && opts.known && byId.size > 0) {
      const unseen = await opts.known.unseen(name, [...byId.keys()]);
      for (const id of byId.keys()) if (!unseen.has(id)) byId.delete(id);
    }
    if (byId.size === 0) continue;

    for (const docs of chunk([...byId.values()], def.batchSize)) {
      try {
        const task = await client.index(name).addDocuments(docs, { primaryKey: "id" });
        submitted.push({ name, docs, taskUid: task.taskUid });
      } catch (err) {
        // A refusal at submission (413, malformed payload) — recovered below, after the
        // accepted work is in flight, so one bad chunk does not stall the rest.
        failures.push({ name, docs, err });
      }
    }
  }

  const recordSent = (name: IndexName, docs: IndexDoc[]) => {
    if (!INDEXES[name].saturates || !opts.known) return;
    const sent = sentByIndex.get(name) ?? [];
    sent.push(...docs.map((doc) => String(doc.id)));
    sentByIndex.set(name, sent);
  };

  if (opts.waitForTasks) {
    // Marks the moment the payload upload is done and Meili owns the work — everything
    // logged after this line is indexing time, not ours.
    if (submitted.length > 0) {
      const total = submitted.reduce((sum, s) => sum + s.docs.length, 0);
      opts.log?.(`meili accepted ${n(total)} docs in ${submitted.length} task(s); indexing…`);
      await awaitSubmission(client, submitted, opts, {
        onDone: (s) => {
          report[s.name] += s.docs.length;
          recordSent(s.name, s.docs);
        },
        onFail: (s, err) => failures.push({ name: s.name, docs: s.docs, err }),
      });
    }
  } else {
    for (const s of submitted) {
      report[s.name] += s.docs.length;
      recordSent(s.name, s.docs);
    }
  }

  // The slow path, serial and rare: bisect a refused chunk down to the document to
  // blame, or throw if the failure is the server's fault. Runs after the parallel wait
  // so an isolated bad chunk costs only its own time.
  for (const f of failures) {
    report[f.name] += await recover(client, f.name, f.docs, opts, f.err);
    // Includes anything the bisect quarantined. Nothing retries a quarantined document,
    // so remembering it is what stops a single poisonous name being re-pushed, refused
    // and re-quarantined by every batch from here to the end of the crawl.
    recordSent(f.name, f.docs);
  }

  // Recorded only after Meili accepted (or the bisect settled) — a chunk whose recover
  // threw never reaches here, so the next drain retries it.
  for (const [name, sent] of sentByIndex) {
    if (sent.length > 0) await opts.known!.remember(name, sent);
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
  opts: { waitForTasks?: boolean; taskTimeoutMs?: number; log?: (message: string) => void } = {},
): Promise<number> {
  if (ids.length === 0) return 0;
  const task = await client.index("theses").deleteDocuments([...ids]);
  if (opts.waitForTasks) await awaitTask(client, "theses", task.taskUid, ids.length, opts);
  return ids.length;
}
