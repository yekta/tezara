import type { MeiliSearch, Rejection } from "@tezara/meili";
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

/** What a refusal looks like in the job log — the documents themselves go to Redis. */
type RejectLog = {
  index: string;
  count: number;
  dropped: boolean;
  payloadBytes: number;
  column: number | null;
  atColumn: string | null;
  reason: string;
};

export type SyncMeiliResult = {
  pushed: number;
  batches: number;
  remaining: number;
  /** Documents Meili refused one at a time; parked in the outbox's dead list. */
  quarantined?: number;
  /** First few refusals, with enough context to tell a bad record from a bad request. */
  rejects?: RejectLog[];
  skipped?: string;
};

/** Enough to diagnose; not so many that a bad batch floods the log. */
const MAX_LOGGED_REJECTS = 5;

/**
 * Drain the outbox into Meili.
 *
 * Commit-after-push: if the push throws, nothing is trimmed and the same batch is
 * retried on the next run. That makes a partial failure a duplicate write (harmless —
 * Meili upserts by primary key) rather than a lost thesis.
 *
 * Held under the outbox drain lock, because peek/commit is only safe for one worker at
 * a time. Sync jobs are queued every minute under a fresh id and claimed ahead of
 * everything else, so several lanes otherwise run this at once, and two commits of the
 * same head trim a batch that was never pushed.
 *
 * A document Meili refuses is bisected out and quarantined rather than retried forever.
 * The alternative is what the outbox does by default: one poisonous record at the head
 * blocks every thesis behind it, indefinitely, while the crawl keeps filling the queue.
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
): Promise<SyncMeiliResult> {
  const batchSize = params.batchSize ?? 1_000;
  const maxBatches = params.maxBatches ?? 20;

  if ((await deps.outbox.depth()) > 0) {
    const drift = await verifySettings(deps.client);
    if (drift.length > 0) throw new SettingsNotMigratedError(drift.map((d) => d.index));
  }

  const rejects: RejectLog[] = [];
  let quarantined = 0;

  const onReject = async (r: Rejection): Promise<void> => {
    if (r.dropped) {
      quarantined += r.docs.length;
      await deps.outbox.quarantine(r.docs, r.reason);
    }
    if (rejects.length < MAX_LOGGED_REJECTS) {
      rejects.push({
        index: r.index,
        count: r.docs.length,
        dropped: r.dropped,
        payloadBytes: r.payloadBytes,
        column: r.atOffset?.column ?? null,
        atColumn: r.atOffset?.excerpt ?? null,
        reason: r.reason.slice(0, 300),
      });
    }
  };

  const drained = await deps.outbox.drain(async () => {
    let pushed = 0;
    let batches = 0;

    for (let i = 0; i < maxBatches; i++) {
      const batch = await deps.outbox.peek(batchSize);
      if (batch.length === 0) break;
      await syncTheses(deps.client, batch, { waitForTasks: true, onReject });
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
      skipped: "another worker holds the drain lock",
    };
  }

  return {
    ...drained,
    remaining: await deps.outbox.depth(),
    ...(quarantined > 0 ? { quarantined } : {}),
    ...(rejects.length > 0 ? { rejects } : {}),
  };
}
