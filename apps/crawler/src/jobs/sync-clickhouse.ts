import type { ClickHouseClient } from "@tezara/clickhouse";
import { rebuildAggregates, syncTheses } from "@tezara/clickhouse";
import type { Outbox } from "../state/outbox.ts";

export type SyncClickhouseParams = { batchSize?: number; maxBatches?: number; rebuild?: boolean };

/**
 * Drain the ClickHouse outbox, then optionally rebuild the aggregate tables.
 *
 * A second outbox, separate from Meili's: the two targets fail independently, and a
 * ClickHouse outage must not hold up search indexing (or vice versa).
 *
 * Commit-after-push, same as the Meili sync — a partial failure re-pushes a batch,
 * which ReplacingMergeTree collapses, rather than losing theses.
 *
 * Held under the outbox drain lock: peek/commit is only safe for one worker at a time,
 * and two lanes committing the same head would trim a batch nobody pushed.
 */
export async function syncClickhouse(
  deps: { client: ClickHouseClient; outbox: Outbox },
  params: SyncClickhouseParams = {},
): Promise<{
  pushed: number;
  batches: number;
  remaining: number;
  rebuilt: string[];
  skipped?: string;
}> {
  const batchSize = params.batchSize ?? 5_000;
  const maxBatches = params.maxBatches ?? 20;

  const drained = await deps.outbox.drain(async () => {
    let pushed = 0;
    let batches = 0;

    for (let i = 0; i < maxBatches; i++) {
      const batch = await deps.outbox.peek(batchSize);
      if (batch.length === 0) break;
      await syncTheses(deps.client, batch);
      await deps.outbox.commit(batch.length);
      pushed += batch.length;
      batches++;
    }

    return { pushed, batches };
  });

  if (drained === null) {
    return {
      pushed: 0,
      batches: 0,
      remaining: await deps.outbox.depth(),
      rebuilt: [],
      skipped: "another worker holds the drain lock",
    };
  }

  const { pushed, batches } = drained;

  // Aggregates are only worth rebuilding when something actually landed.
  const rebuilt = pushed > 0 && params.rebuild !== false ? await rebuildAggregates(deps.client) : [];

  return { pushed, batches, remaining: await deps.outbox.depth(), rebuilt };
}
