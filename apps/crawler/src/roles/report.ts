import type { Job } from "../queue/queue.ts";

/**
 * Turns job results into lines a human can read at 3am.
 *
 * The raw `{"ok":50,"gap":0,"error":0,"skipped":0}` a job returns says nothing about
 * *which* work it was, how long it took, or whether the number is good — and those are
 * the only three questions anyone asks of a crawler log.
 */

const n = (value: number) => value.toLocaleString("en-US");

function secs(ms: number): string {
  if (ms < 1_000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1_000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m${Math.round((ms % 60_000) / 1_000)}s`;
}

/** Best-effort field read off a job result, which is typed as unknown by the worker. */
const field = <T>(detail: unknown, key: string): T | undefined =>
  (detail as Record<string, T> | null | undefined)?.[key];

function describeDetail(job: Job, detail: unknown): string {
  const p = job.params as Record<string, number>;

  switch (job.kind) {
    case "scan-id-range": {
      const ok = field<number>(detail, "ok") ?? 0;
      const gap = field<number>(detail, "gap") ?? 0;
      const err = field<number>(detail, "error") ?? 0;
      const skipped = field<number>(detail, "skipped") ?? 0;
      const parts = [`${ok} crawled`];
      // A gap is a thesis id YÖK has no record for — normal, and not a failure.
      if (gap) parts.push(`${gap} absent upstream`);
      if (skipped) parts.push(`${skipped} already held`);
      if (err) parts.push(`${err} FAILED`);
      return `ids ${n(p.from ?? 0)}..${n(p.to ?? 0)}: ${parts.join(", ")}`;
    }

    case "discover-head": {
      const found = field<number[]>(detail, "found") ?? [];
      const watermark = field<number>(detail, "watermark") ?? 0;
      return found.length === 0
        ? `no new ids past ${n(watermark)}`
        : `${found.length} new id(s) past ${n(watermark)}, highest now ${n(Math.max(...found))}`;
    }

    case "sync-meili":
    case "sync-clickhouse": {
      const target = job.kind === "sync-meili" ? "meili" : "clickhouse";
      const skipped = field<string>(detail, "skipped");
      const remaining = field<number>(detail, "remaining") ?? 0;
      if (skipped) return `${target}: ${skipped} — ${n(remaining)} still queued`;

      const pushed = field<number>(detail, "pushed") ?? 0;
      const batches = field<number>(detail, "batches") ?? 0;
      const quarantined = field<number>(detail, "quarantined");
      const parts = [`${target}: indexed ${n(pushed)} in ${batches} batch(es)`];
      parts.push(`${n(remaining)} left`);
      if (quarantined) parts.push(`${n(quarantined)} QUARANTINED`);
      return parts.join(", ");
    }

    case "reconcile-year": {
      const unavailable = field<string>(detail, "reason");
      if (unavailable) return `year ${p.year}: could not check — ${unavailable}`;
      const reported = field<number>(detail, "reported") ?? 0;
      const held = field<number>(detail, "held") ?? 0;
      const drift = field<number>(detail, "drift") ?? 0;
      return drift > 0
        ? `year ${p.year}: YÖK has ${n(reported)}, we hold ${n(held)} — missing ${n(drift)}`
        : `year ${p.year}: complete (${n(held)} of ${n(reported)})`;
    }

    default:
      return JSON.stringify(detail);
  }
}

export function describeJob(
  job: Job,
  outcome: "ok" | "retry" | "dead",
  detail: unknown,
  elapsedMs: number,
): string {
  if (outcome === "ok") {
    return `${describeDetail(job, detail)} [${secs(elapsedMs)}]`;
  }
  // A failure's detail is the error message, and the attempt count is the useful part:
  // "retry 3/5" tells you how close this job is to being abandoned.
  const label = outcome === "dead" ? "GAVE UP on" : `retry ${job.attempts + 1} of`;
  return `${label} ${job.kind} ${JSON.stringify(job.params)} after ${secs(elapsedMs)}: ${String(detail)}`;
}

function bytes(value: number): string {
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(1)}GB`;
  if (value >= 1024 ** 2) return `${Math.round(value / 1024 ** 2)}MB`;
  return `${Math.round(value / 1024)}KB`;
}

export type CrawlerStatus = {
  crawl: { backfillCursor: number; maxThesisId: number; backfillPercent: number };
  queue: { pending: number; running: number; dead: number };
  pendingProjection: { meili: number; clickhouse: number; meiliQuarantined: number };
  upstream: { breaker: string; consecutiveFailures: number };
  reconciliation: { yearsShort: number; missingRecords: number };
  search: { databaseSizeBytes?: number; indexedTheses?: number; unreachable?: string } | null;
};

/**
 * The one line that answers "is it working?" — logged on a timer, because a log made of
 * nothing but per-job lines never shows the totals that actually matter.
 */
export function describeStatus(status: CrawlerStatus, crawledLastMinute: number): string {
  const { crawl, queue, pendingProjection: outbox, upstream } = status;
  const parts = [
    `backfill ${n(crawl.backfillCursor)}/${n(crawl.maxThesisId)} (${crawl.backfillPercent}%)`,
    `${n(crawledLastMinute)} ids/min`,
    `queue ${n(queue.pending)} pending, ${n(queue.running)} running`,
    `outbox meili ${n(outbox.meili)}, clickhouse ${n(outbox.clickhouse)}`,
  ];
  if (status.search?.unreachable) {
    parts.push(`MEILI UNREACHABLE: ${status.search.unreachable}`);
  } else if (status.search) {
    parts.push(
      `meili ${n(status.search.indexedTheses ?? 0)} indexed` +
        `, ${bytes(status.search.databaseSizeBytes ?? 0)} on disk`,
    );
  }
  if (queue.dead) parts.push(`${n(queue.dead)} DEAD JOBS (see /failures)`);
  if (outbox.meiliQuarantined) {
    parts.push(`${n(outbox.meiliQuarantined)} QUARANTINED DOCS (see /failures)`);
  }
  if (upstream.breaker !== "closed") {
    parts.push(`upstream breaker ${upstream.breaker} after ${upstream.consecutiveFailures} failures`);
  }
  if (status.reconciliation.missingRecords) {
    parts.push(`${n(status.reconciliation.missingRecords)} records short of YÖK`);
  }
  return `status — ${parts.join(" · ")}`;
}
