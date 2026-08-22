import type { MeiliSearch } from "@tezara/meili";
import { syncTheses } from "@tezara/meili";
import type { Outbox } from "../state/outbox.ts";

export type SyncMeiliParams = { batchSize?: number; maxBatches?: number };

/**
 * Drain the outbox into Meili.
 *
 * Commit-after-push: if the push throws, nothing is trimmed and the same batch is
 * retried on the next run. That makes a partial failure a duplicate write (harmless —
 * Meili upserts by primary key) rather than a lost thesis.
 */
export async function syncMeili(
  deps: { client: MeiliSearch; outbox: Outbox },
  params: SyncMeiliParams = {},
): Promise<{ pushed: number; batches: number; remaining: number }> {
  const batchSize = params.batchSize ?? 1_000;
  const maxBatches = params.maxBatches ?? 20;

  let pushed = 0;
  let batches = 0;

  for (let i = 0; i < maxBatches; i++) {
    const batch = await deps.outbox.peek(batchSize);
    if (batch.length === 0) break;
    await syncTheses(deps.client, batch, { waitForTasks: true });
    await deps.outbox.commit(batch.length);
    pushed += batch.length;
    batches++;
  }

  return { pushed, batches, remaining: await deps.outbox.depth() };
}
