import { createHash } from "node:crypto";
import type { JobContext } from "./context.ts";
import type { ScanRecord } from "../state/ch-scan.ts";
import { fetchThesisById } from "../yok/client.ts";

export type CrawlCounts = {
  ok: number;
  gap: number;
  error: number;
  skipped: number;
  /** Re-visited and identical — recorded, but nothing pushed to the projections. */
  unchanged: number;
};

const hashThesis = (t: unknown) =>
  createHash("sha1").update(JSON.stringify(t)).digest("hex").slice(0, 16);

/**
 * Crawl one id and record the outcome. The scan write is buffered — the loop flushes
 * after each work unit, so a crash costs at most one unit's worth of re-crawling.
 */
async function crawlOne(
  ctx: JobContext,
  id: number,
  previous: ScanRecord | null,
  counts: CrawlCounts,
): Promise<void> {
  const outcome = await fetchThesisById(ctx.session, id, ctx.lookups);
  switch (outcome.status) {
    case "ok": {
      const contentHash = hashThesis(outcome.thesis);
      // A re-visit that finds the same content costs zero projection work: the record
      // is re-stamped (pushing next_check_at forward) but nothing enters the outbox.
      if (previous?.state === "ok" && previous.contentHash === contentHash) {
        ctx.scan.record(id, "ok", { contentHash, previous });
        counts.unchanged++;
        return;
      }
      await ctx.outbox.push([outcome.thesis]);
      ctx.scan.record(id, "ok", { contentHash, previous });
      await ctx.scan.raiseWatermark("head", id);
      counts.ok++;
      return;
    }
    case "gap": {
      ctx.scan.record(id, "gap", { previous });
      counts.gap++;
      return;
    }
    // A dropped TezNo filter means YÖK returned the whole corpus. Never ingest that;
    // treat it as an error so the id is retried rather than recorded as a gap.
    case "filter-ignored":
    case "detail-failed":
    case "maintenance":
    case "error": {
      ctx.scan.record(id, "error", { previous });
      counts.error++;
      return;
    }
  }
}

export type ScanRangeParams = { from: number; to: number };

/**
 * Walk a contiguous block of NEW thesis ids — the backfill.
 *
 * Resumable by construction: ids already recorded are skipped (one range query, not a
 * round trip per id), so a unit that dies half-way costs only the ids it had not
 * reached. Ids it never reaches are caught by the projection reconcile's sweep for
 * unscanned ids below the backfill cursor.
 */
export async function scanRange(
  ctx: JobContext,
  params: ScanRangeParams,
  signal?: AbortSignal,
): Promise<CrawlCounts> {
  const counts: CrawlCounts = { ok: 0, gap: 0, error: 0, skipped: 0, unchanged: 0 };
  const recorded = await ctx.scan.recordedInRange(params.from, params.to);

  for (let id = params.from; id <= params.to; id++) {
    if (signal?.aborted) break;
    if (recorded.has(id)) {
      counts.skipped++;
      continue;
    }
    await crawlOne(ctx, id, null, counts);
  }
  return counts;
}

export type RefreshIdsParams = { ids: number[] };

/**
 * Re-visit ids that are due — error retries, gap re-checks, staleness refreshes, and
 * anything the projection reconcile flagged. Unlike the backfill this crawls ids that
 * HAVE records; the content hash decides whether anything is actually re-pushed.
 *
 * (The previous design routed re-checks through the backfill scan, which skipped every
 * recorded id — so error retries and refreshes silently never happened.)
 */
export async function refreshIds(
  ctx: JobContext,
  params: RefreshIdsParams,
  signal?: AbortSignal,
): Promise<CrawlCounts> {
  const counts: CrawlCounts = { ok: 0, gap: 0, error: 0, skipped: 0, unchanged: 0 };
  const previous = await ctx.scan.getMany(params.ids);

  for (const id of params.ids) {
    if (signal?.aborted) break;
    await crawlOne(ctx, id, previous.get(id) ?? null, counts);
  }
  return counts;
}
