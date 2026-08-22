import type { MeiliSearch } from "@tezara/meili";
import { syncTheses, verifySettings } from "@tezara/meili";
import type { Outbox } from "../state/outbox.ts";

export class SettingsNotMigratedError extends Error {
  constructor(indexes: string[]) {
    super(
      `Meili indexes are not migrated: ${indexes.join(", ")}. ` +
      `Run \`pnpm --filter @tezara/crawler migrate\` first.`,
    );
    this.name = "SettingsNotMigratedError";
  }
}

export type SyncMeiliParams = { batchSize?: number; maxBatches?: number };

/**
 * Drain the outbox into Meili.
 *
 * Commit-after-push: if the push throws, nothing is trimmed and the same batch is
 * retried on the next run. That makes a partial failure a duplicate write (harmless —
 * Meili upserts by primary key) rather than a lost thesis.
 *
 * Refuses to run against un-migrated indexes. This guard is not paranoia: addDocuments
 * silently auto-creates a missing index with Meili's defaults — no filterable
 * attributes, maxTotalHits 1000 — which leaves the corpus searchable but every filter
 * the web app sends returning nothing, with no error anywhere. Failing the job instead
 * keeps the outbox intact so nothing is lost while the migration is run.
 */
export async function syncMeili(
  deps: { client: MeiliSearch; outbox: Outbox },
  params: SyncMeiliParams = {},
): Promise<{ pushed: number; batches: number; remaining: number }> {
  const batchSize = params.batchSize ?? 1_000;
  const maxBatches = params.maxBatches ?? 20;

  if ((await deps.outbox.depth()) > 0) {
    const drift = await verifySettings(deps.client);
    if (drift.length > 0) throw new SettingsNotMigratedError(drift.map((d) => d.index));
  }

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
