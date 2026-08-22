import type { Job, Queue } from "../queue/queue.ts";
import type { JobContext } from "../jobs/context.ts";
import { scanIdRange, type ScanIdRangeParams } from "../jobs/scan-id-range.ts";
import { discoverHead, type DiscoverHeadParams } from "../jobs/discover-head.ts";
import { syncMeili, type SyncMeiliParams } from "../jobs/sync-meili.ts";

const REAP_INTERVAL_MS = 30_000;
const IDLE_SLEEP_MS = 2_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runJob(ctx: JobContext, job: Job, signal?: AbortSignal): Promise<unknown> {
  switch (job.kind) {
    case "scan-id-range":
      return scanIdRange(ctx, job.params as ScanIdRangeParams, signal);
    case "discover-head":
      return discoverHead(ctx, job.params as DiscoverHeadParams, signal);
    case "sync-meili": {
      if (!ctx.meili) throw new Error("sync-meili requires a Meili client");
      return syncMeili({ client: ctx.meili, outbox: ctx.outbox }, job.params as SyncMeiliParams);
    }
    default:
      throw new Error(`no handler for job kind "${job.kind}"`);
  }
}

export type WorkerOptions = {
  signal?: AbortSignal;
  onEvent?: (event: { job: Job; outcome: "ok" | "retry" | "dead"; detail?: unknown }) => void;
  /** Stop once the queue drains — used by the backfill CLI and by tests. */
  exitWhenDrained?: boolean;
};

export async function runWorker(
  ctx: JobContext,
  queue: Queue,
  opts: WorkerOptions = {},
): Promise<void> {
  const { signal, onEvent } = opts;
  let lastReap = 0;

  while (!signal?.aborted) {
    if (Date.now() - lastReap > REAP_INTERVAL_MS) {
      await queue.reap();
      lastReap = Date.now();
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

    try {
      const detail = await runJob(ctx, job, signal);
      await queue.complete(job);
      onEvent?.({ job, outcome: "ok", detail });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const outcome = await queue.fail(job, message);
      onEvent?.({ job, outcome, detail: message });
    }
  }
}
