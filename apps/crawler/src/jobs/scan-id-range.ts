import { createHash } from "node:crypto";
import type { JobContext } from "./context.ts";
import { fetchThesisById } from "../yok/client.ts";

export type ScanIdRangeParams = { from: number; to: number };

export type ScanIdRangeResult = {
  ok: number;
  gap: number;
  error: number;
  skipped: number;
};

const hashThesis = (t: unknown) =>
  createHash("sha1").update(JSON.stringify(t)).digest("hex").slice(0, 16);

/**
 * Walk a contiguous block of thesis ids.
 *
 * Resumable by construction: ids already recorded in the scan store are skipped, so a
 * job that dies half-way costs only the ids it had not reached. That is also why ranges
 * are the unit of work rather than individual ids — one queue entry per id would mean
 * a million queue entries.
 */
export async function scanIdRange(
  ctx: JobContext,
  params: ScanIdRangeParams,
  signal?: AbortSignal,
): Promise<ScanIdRangeResult> {
  const result: ScanIdRangeResult = { ok: 0, gap: 0, error: 0, skipped: 0 };

  for (let id = params.from; id <= params.to; id++) {
    if (signal?.aborted) break;

    if (await ctx.scan.get(id)) {
      result.skipped++;
      continue;
    }

    const outcome = await fetchThesisById(ctx.session, id, ctx.lookups);
    switch (outcome.status) {
      case "ok": {
        await ctx.outbox.push([outcome.thesis]);
        await ctx.scan.record(id, "ok", { contentHash: hashThesis(outcome.thesis) });
        await ctx.scan.raiseWatermark("head", id);
        result.ok++;
        break;
      }
      case "gap": {
        await ctx.scan.record(id, "gap");
        result.gap++;
        break;
      }
      // A dropped TezNo filter means YÖK returned the whole corpus. Never ingest that;
      // treat it as an error so the id is retried rather than recorded as a gap.
      case "filter-ignored":
      case "detail-failed":
      case "maintenance":
      case "error": {
        await ctx.scan.record(id, "error");
        result.error++;
        break;
      }
    }
  }

  return result;
}
