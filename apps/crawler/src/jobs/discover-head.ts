import type { JobContext } from "./context.ts";
import { scanRange } from "./crawl.ts";

export type DiscoverHeadParams = { probe?: number };

/**
 * New theses always take ids above the current watermark, so the live tail is just a
 * short probe past the head. This is what makes the crawler a service rather than a
 * one-shot job.
 *
 * The id space has real holes — 500,000–500,079 is entirely empty — so a single miss
 * proves nothing. Probe a window and take the highest hit; every `ok` raises the head
 * watermark from inside the crawl itself.
 *
 * Ids already recorded (gaps from earlier probes of the same window) are skipped —
 * their own gap schedule re-checks them — so a static head costs almost nothing to
 * keep probing.
 */
export async function discoverHead(
  ctx: JobContext,
  params: DiscoverHeadParams = {},
  signal?: AbortSignal,
): Promise<{ from: number; found: number; watermark: number }> {
  const probe = params.probe ?? 100;
  const head = (await ctx.scan.watermark("head")) ?? 0;

  const counts = await scanRange(ctx, { from: head + 1, to: head + probe }, signal);

  return {
    from: head + 1,
    found: counts.ok,
    watermark: (await ctx.scan.watermark("head")) ?? head,
  };
}
