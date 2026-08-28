import { compactIndex, readUsage, type CompactionReport, type MeiliSearch } from "@tezara/meili";

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

  return {
    async afterDrain() {
      const usage = await readUsage(opts.client, "theses");

      // First drain of the process: anchor the watermark, do not compact. Otherwise a
      // crawler that restarts often would compact on every boot.
      if (checkedAtDocs === null) {
        checkedAtDocs = usage.documents;
        return null;
      }

      if (usage.documents - checkedAtDocs < opts.everyDocs) return null;
      checkedAtDocs = usage.documents;

      if (usage.ratio < opts.minRatio) {
        log(
          `meili: skipping compaction at ${usage.documents.toLocaleString("en-US")} docs — ` +
            `file is ${usage.ratio.toFixed(2)}x live, under the ${opts.minRatio}x threshold`,
        );
        return null;
      }

      return await compactIndex(opts.client, "theses", { log });
    },
  };
}
