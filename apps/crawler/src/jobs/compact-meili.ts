import {
  compactIndex,
  readUsage,
  type CompactionReport,
  type MeiliSearch,
  type Usage,
} from "@tezara/meili";

/**
 * Keep Meili's file from drifting away from the data it holds, during the crawl rather
 * than after it.
 *
 * Compaction is copy-then-swap, so it needs free space for a second copy of the index.
 * That makes *when* it runs the whole game: compacting at 10GB needs ~24GB of headroom,
 * compacting the finished 20GB index needs ~48GB. Running every `everyDocs` documents
 * keeps every compaction small and cheap, so the volume only ever has to be about twice
 * the index at its current size — not twice its final size.
 *
 * The document watermark is deliberately in-process. Losing it on restart delays one
 * compaction by up to `everyDocs` documents and corrupts nothing, which is not worth a
 * Redis key and the wipe/restore semantics that come with one.
 */
export type CompactionPolicy = {
  /** Called once before the crawl starts; compacts when the file is already fragmented. */
  onBoot(): Promise<CompactionReport | null>;
  /** Called after each Meili drain; compacts when both cadence and fragmentation say so. */
  afterDrain(): Promise<CompactionReport | null>;
};

export type CompactionOptions = {
  client: MeiliSearch;
  /** Documents between checks. */
  everyDocs: number;
  /**
   * Skip the compaction when the file is already this dense. A compaction that reclaims
   * nothing still copies the entire index, which on a full corpus is ~19 minutes of I/O
   * competing with the crawl.
   */
  minRatio: number;
  log?: (message: string) => void;
};

export function createCompactionPolicy(opts: CompactionOptions): CompactionPolicy {
  const log = opts.log ?? (() => {});
  let checkedAtDocs: number | null = null;

  /** Shared tail: compact unless the file is already dense enough not to be worth it. */
  async function compactIfFragmented(usage: Usage): Promise<CompactionReport | null> {
    if (usage.ratio < opts.minRatio) {
      log(
        `meili: skipping compaction at ${usage.documents.toLocaleString("en-US")} docs — ` +
          `file is ${usage.ratio.toFixed(2)}x live, under the ${opts.minRatio}x threshold`,
      );
      return null;
    }
    return await compactIndex(opts.client, "theses", { log });
  }

  return {
    /**
     * Boot is the one moment with nothing to compete with, and the only moment a crawler
     * that has finished its corpus ever gets: `afterDrain` needs `everyDocs` NEW documents
     * to fire, so a restart on a complete index would otherwise never compact it again.
     *
     * Unlike the cadence, the ratio gate is stateless — it is read back from Meili. A
     * compacted index reports ~1.0, so the next boot skips and a restart loop cannot turn
     * into a compaction loop. (A process killed mid-compaction is the exception: the task
     * survives server-side and the next boot queues a second one behind it. That wastes
     * time, not data.)
     */
    async onBoot() {
      const usage = await readUsage(opts.client, "theses");
      // Anchor here too, so the first drain does not immediately re-read for nothing.
      checkedAtDocs = usage.documents;
      return await compactIfFragmented(usage);
    },

    async afterDrain() {
      const usage = await readUsage(opts.client, "theses");

      // First drain of a process that never got its boot check (Meili was down, say):
      // anchor the watermark, do not compact. Otherwise a crawler that restarts often
      // would compact on every boot.
      if (checkedAtDocs === null) {
        checkedAtDocs = usage.documents;
        return null;
      }

      if (usage.documents - checkedAtDocs < opts.everyDocs) return null;
      checkedAtDocs = usage.documents;

      return await compactIfFragmented(usage);
    },
  };
}
