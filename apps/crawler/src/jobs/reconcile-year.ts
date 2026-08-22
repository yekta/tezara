import type { JobContext } from "./context.ts";
import { fetchYearCount } from "../yok/client.ts";
import type { YearReconciliation } from "../state/reconcile.ts";

export type ReconcileYearParams = { year: number };

/**
 * Compare our holdings for one year against YÖK's own total.
 *
 * Detection only — it deliberately does not try to guess which ids are missing, because
 * it cannot: a year maps to no contiguous id range. What it does is make a hole
 * *visible* (and alertable), and pull forward the re-check of ids currently recorded as
 * gaps, since an id that reads empty today is exactly where a missing thesis hides.
 */
export async function reconcileYear(
  ctx: JobContext,
  params: ReconcileYearParams,
): Promise<YearReconciliation | { status: "unavailable"; reason: string }> {
  if (!ctx.reconcile) return { status: "unavailable", reason: "no reconcile store" };
  if (!ctx.countHeldForYear) return { status: "unavailable", reason: "no projection to count" };

  const upstream = await fetchYearCount(ctx.session, params.year);
  if (upstream.status !== "ok") {
    return { status: "unavailable", reason: `upstream ${upstream.status}` };
  }

  const held = await ctx.countHeldForYear(params.year);
  const entry: YearReconciliation = {
    year: params.year,
    reported: upstream.count,
    held,
    drift: upstream.count - held,
    checkedAt: Date.now(),
  };
  await ctx.reconcile.record(entry);
  return entry;
}
