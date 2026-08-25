import type { ClickHouseClient } from "@tezara/clickhouse";
import { rebuildAggregates, syncTheses } from "@tezara/clickhouse";
import type { Outbox } from "../state/outbox.ts";

export type SyncClickhouseParams = {
  batchSize?: number;
  maxBatches?: number;
  /** `false` drains only and leaves the aggregates marked dirty for a later run. */
  rebuild?: boolean;
  /** Rebuild at most this often; dirt accumulates in between. */
  rebuildEveryMs?: number;
};

export type SyncClickhouseResult = {
  pushed: number;
  batches: number;
  remaining: number;
  /** Aggregate tables rebuilt and swapped in on this run. */
  rebuilt: string[];
  /** Aggregates are stale but a rebuild was held back; says why. */
  rebuildHeld?: string;
  skipped?: string;
};

/**
 * Persistent markers for "the aggregates no longer match the base tables".
 *
 * Both are epoch-ms watermarks (monotonic, no TTL). `dirtyAt` is raised whenever a push
 * lands; `rebuiltAt` is raised to the rebuild's *start* time once it succeeds. The
 * aggregates are stale iff dirtyAt > rebuiltAt.
 */
export type RebuildMarks = {
  watermark(name: string): Promise<number | null>;
  raiseWatermark(name: string, value: number): Promise<number>;
};

export const DIRTY_MARK = "clickhouse:aggregatesDirtyAt";
export const REBUILT_MARK = "clickhouse:aggregatesRebuiltAt";

/**
 * Sync jobs are queued every minute; a full rebuild is several FINAL scans and joins
 * over every thesis, and on a small server runs for a good fraction of that minute.
 * Ten minutes keeps the stats pages fresh enough during a crawl without the server
 * spending most of its time re-deriving the same numbers.
 */
export const DEFAULT_REBUILD_EVERY_MS = 10 * 60_000;

/**
 * Drain the ClickHouse outbox, then rebuild the aggregate tables if they are stale.
 *
 * A second outbox, separate from Meili's: the two targets fail independently, and a
 * ClickHouse outage must not hold up search indexing (or vice versa).
 *
 * Commit-after-push, same as the Meili sync — a partial failure re-pushes a batch,
 * which ReplacingMergeTree collapses, rather than losing theses.
 *
 * Staleness is tracked in durable marks, not inferred from this run's `pushed`. The previous
 * version rebuilt iff this run pushed something — so a rebuild that failed (memory
 * limit, say) was retried by the queue, found the outbox already drained, pushed
 * nothing, and "succeeded" without rebuilding. The aggregates then stayed stale until
 * the next push happened to coincide with a rebuild that fit. Now the marks outlive the
 * job: a failed rebuild is retried by every following sync until one lands.
 *
 * Drain and rebuild both run under the outbox drain lock. peek/commit is only safe for
 * one worker at a time (two lanes committing the same head would trim a batch nobody
 * pushed), and one rebuild at a time is all the server has memory for — two concurrent
 * ones is exactly how to hit the limit again.
 */
export async function syncClickhouse(
  deps: {
    client: ClickHouseClient;
    outbox: Outbox;
    marks: RebuildMarks;
    log?: (message: string) => void;
    now?: () => number;
  },
  params: SyncClickhouseParams = {},
): Promise<SyncClickhouseResult> {
  const batchSize = params.batchSize ?? 5_000;
  const maxBatches = params.maxBatches ?? 20;
  const rebuildEveryMs = params.rebuildEveryMs ?? DEFAULT_REBUILD_EVERY_MS;
  const now = deps.now ?? Date.now;

  const drained = await deps.outbox.drain("clickhouse", async () => {
    let pushed = 0;
    let batches = 0;

    for (let i = 0; i < maxBatches; i++) {
      const batch = await deps.outbox.peek("clickhouse", batchSize);
      if (batch.length === 0) break;
      const started = Date.now();
      await syncTheses(deps.client, batch);
      await deps.outbox.commit("clickhouse", batch.map((t) => t.id));
      // Under the same lock as the rebuild below, so no run can observe the push
      // without also observing the dirt.
      await deps.marks.raiseWatermark(DIRTY_MARK, now());
      pushed += batch.length;
      batches++;
      deps.log?.(
        `clickhouse batch ${batches}/${maxBatches}: ${batch.length} rows in ` +
          `${Math.round((Date.now() - started) / 1000)}s, ${await deps.outbox.depth("clickhouse")} left`,
      );
    }

    const [dirtyAt, rebuiltAt] = await Promise.all([
      deps.marks.watermark(DIRTY_MARK),
      deps.marks.watermark(REBUILT_MARK),
    ]);
    const stale = dirtyAt !== null && (rebuiltAt === null || dirtyAt > rebuiltAt);

    let rebuilt: string[] = [];
    let rebuildHeld: string | undefined;
    if (stale) {
      const sinceLast = rebuiltAt === null ? Infinity : now() - rebuiltAt;
      if (params.rebuild === false) {
        rebuildHeld = "rebuild disabled for this run";
      } else if (sinceLast < rebuildEveryMs) {
        rebuildHeld = `last rebuild ${Math.round(sinceLast / 1000)}s ago, next in ` +
          `${Math.round((rebuildEveryMs - sinceLast) / 1000)}s`;
      } else {
        // Stamp the start, not the end: a push that lands mid-rebuild (only possible
        // if this lock is lost) must leave the aggregates marked stale.
        const startedAt = now();
        const started = Date.now();
        rebuilt = await rebuildAggregates(deps.client);
        await deps.marks.raiseWatermark(REBUILT_MARK, startedAt);
        deps.log?.(
          `clickhouse aggregates rebuilt (${rebuilt.join(", ")}) in ` +
            `${Math.round((Date.now() - started) / 1000)}s`,
        );
      }
    }

    return { pushed, batches, rebuilt, rebuildHeld };
  });

  if (drained === null) {
    return {
      pushed: 0,
      batches: 0,
      remaining: await deps.outbox.depth("clickhouse"),
      rebuilt: [],
      skipped: "another drainer holds the lock",
    };
  }

  return { ...drained, remaining: await deps.outbox.depth("clickhouse") };
}
