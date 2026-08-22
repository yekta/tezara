import type { JobContext } from "./context.ts";
import { fetchThesisById } from "../yok/client.ts";

export type DiscoverHeadParams = { probe?: number };

/**
 * New theses always take ids above the current watermark, so the live tail is just a
 * short probe past the head. This is what makes the crawler a service rather than a
 * one-shot job.
 *
 * The id space has real holes — 500,000–500,079 is entirely empty — so a single miss
 * proves nothing. Probe a window and take the highest hit.
 */
export async function discoverHead(
  ctx: JobContext,
  params: DiscoverHeadParams = {},
  signal?: AbortSignal,
): Promise<{ from: number; found: number[]; watermark: number }> {
  const probe = params.probe ?? 100;
  const head = (await ctx.scan.watermark("head")) ?? 0;
  const found: number[] = [];

  for (let id = head + 1; id <= head + probe; id++) {
    if (signal?.aborted) break;
    if (await ctx.scan.get(id)) continue;

    const outcome = await fetchThesisById(ctx.session, id, ctx.lookups);
    if (outcome.status === "ok") {
      await ctx.outbox.push([outcome.thesis]);
      await ctx.scan.record(id, "ok");
      await ctx.scan.raiseWatermark("head", id);
      found.push(id);
    } else if (outcome.status === "gap") {
      await ctx.scan.record(id, "gap");
    } else {
      await ctx.scan.record(id, "error");
    }
  }

  return { from: head + 1, found, watermark: (await ctx.scan.watermark("head")) ?? head };
}
