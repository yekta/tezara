import type { Job, Queue } from "../queue/queue.ts";
import type { Session } from "../yok/session.ts";
import type { JobContext } from "../jobs/context.ts";
import { scanIdRange, type ScanIdRangeParams } from "../jobs/scan-id-range.ts";
import {
  discoverHead,
  type DiscoverHeadParams,
} from "../jobs/discover-head.ts";
import { syncMeili, type SyncMeiliParams } from "../jobs/sync-meili.ts";
import {
  syncClickhouse,
  type SyncClickhouseParams,
} from "../jobs/sync-clickhouse.ts";
import {
  reconcileYear,
  type ReconcileYearParams,
} from "../jobs/reconcile-year.ts";

const REAP_INTERVAL_MS = 30_000;
const IDLE_SLEEP_MS = 2_000;
/** Renew well inside the lease so a slow tick cannot let it lapse. */
const HEARTBEAT_MS = 60_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runJob(
  ctx: JobContext,
  job: Job,
  signal?: AbortSignal,
): Promise<unknown> {
  switch (job.kind) {
    case "scan-id-range":
      return scanIdRange(ctx, job.params as ScanIdRangeParams, signal);
    case "discover-head":
      return discoverHead(ctx, job.params as DiscoverHeadParams, signal);
    // An unconfigured projection target is a valid deployment, not a failure: the
    // scheduler cannot know which targets a given worker has, so skipping here is what
    // keeps a Meili-only (or ClickHouse-only) deployment from dead-lettering jobs
    // forever.
    case "sync-meili": {
      if (!ctx.meili) return { skipped: "no Meili client configured" };
      return syncMeili(
        { client: ctx.meili, outbox: ctx.outbox, log: ctx.log },
        job.params as SyncMeiliParams,
      );
    }
    case "sync-clickhouse": {
      if (!ctx.clickhouse || !ctx.clickhouseOutbox) {
        return { skipped: "no ClickHouse client configured" };
      }
      return syncClickhouse(
        { client: ctx.clickhouse, outbox: ctx.clickhouseOutbox, marks: ctx.scan, log: ctx.log },
        job.params as SyncClickhouseParams,
      );
    }
    case "reconcile-year":
      return reconcileYear(ctx, job.params as ReconcileYearParams);
    default:
      throw new Error(`no handler for job kind "${job.kind}"`);
  }
}

export type WorkerOptions = {
  signal?: AbortSignal;
  /** How many jobs to run at once. Each gets its own YÖK session. */
  concurrency?: number;
  /**
   * Opens a fresh YÖK session for a lane.
   *
   * SearchTez stores the query in the server-side session, so two concurrent requests
   * sharing one JSESSIONID overwrite each other and both get whichever search landed
   * last — a valid-looking page for the wrong thesis. Sessions are therefore per-lane,
   * never shared.
   */
  newSession?: () => Promise<Session>;
  onEvent?: (event: {
    job: Job;
    outcome: "ok" | "retry" | "dead";
    detail?: unknown;
    /** How long the job actually took — the number that tells you if it is stuck. */
    elapsedMs: number;
  }) => void;
  /** Stop once the queue drains — used by the backfill CLI and by tests. */
  exitWhenDrained?: boolean;
};

export async function runWorker(
  ctx: JobContext,
  queue: Queue,
  opts: WorkerOptions = {},
): Promise<void> {
  const { signal, onEvent } = opts;
  const concurrency = Math.max(1, opts.concurrency ?? 1);
  let lastReap = 0;

  /**
   * One job at a time, start to finish. Several of these run in parallel.
   *
   * Concurrency matters here because a single lane is latency-bound, not rate-bound:
   * three sequential round trips per thesis at ~400ms each means ~2.5 requests/second
   * however high the rate limit is set. Extra lanes keep requests in flight while others
   * wait, so the shared token bucket becomes the actual ceiling — which is the number we
   * want to control.
   */
  const lane = async (): Promise<void> => {
    const session = await opts.newSession?.();
    const laneCtx = session ? { ...ctx, session } : ctx;

    try {
      while (!signal?.aborted) {
        if (Date.now() - lastReap > REAP_INTERVAL_MS) {
          // Cheap and idempotent, so it does not matter which lane gets there first.
          lastReap = Date.now();
          await queue.reap();
        }

        const [job] = await queue.claim(1);
        if (!job) {
          if (opts.exitWhenDrained) {
            const { leased } = await queue.stats();
            if (leased === 0) return;
          }
          await sleep(IDLE_SLEEP_MS);
          continue;
        }

        // Hold the lease for as long as the job actually runs.
        const heartbeat = setInterval(() => {
          void queue.renewLease(job);
        }, HEARTBEAT_MS);
        const startedAt = Date.now();
        try {
          const detail = await runJob(laneCtx, job, signal);
          await queue.complete(job);
          onEvent?.({ job, outcome: "ok", detail, elapsedMs: Date.now() - startedAt });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const outcome = await queue.fail(job, message);
          onEvent?.({ job, outcome, detail: message, elapsedMs: Date.now() - startedAt });
        } finally {
          clearInterval(heartbeat);
        }
      }
    } finally {
      await session?.close().catch(() => {});
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => lane()));
}
