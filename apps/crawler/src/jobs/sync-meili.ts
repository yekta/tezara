import type { MeiliSearch, Rejection } from "@tezara/meili";
import { applySettings, syncTheses, verifySettings } from "@tezara/meili";
import type { Outbox } from "../state/outbox.ts";

export class SettingsNotMigratedError extends Error {
  constructor(indexes: string[]) {
    super(
      `Meili indexes exist but their settings have drifted: ${indexes.join(", ")}. ` +
      `Run \`pnpm --filter @tezara/crawler migrate\` — changing settings on a populated ` +
      `index forces a full reindex, so it is not done automatically.`,
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
  deps: { client: MeiliSearch; outbox: Outbox; log?: (message: string) => void },
  params: SyncMeiliParams = {},
): Promise<SyncMeiliResult> {
  const batchSize = params.batchSize ?? 1_000;
  const maxBatches = params.maxBatches ?? 20;
  const log = deps.log ?? (() => {});

  if ((await deps.outbox.depth()) > 0) {
    const drift = await verifySettings(deps.client);

    // An index that does not exist yet is not a migration decision. If we do nothing,
    // addDocuments creates it anyway — with Meili's defaults, no filterable attributes
    // and maxTotalHits 1000 — which is the silent breakage this guard exists to prevent.
    // Creating it properly is strictly better, and it is what lets a brand new Meili
    // service come up without a human running anything.
    const absent = drift.filter((d) => d.missing);
    if (absent.length > 0) {
      const names = absent.map((d) => d.index);
      await applySettings(deps.client, { only: names, waitForTasks: true });
      log(`created ${names.length} missing Meili index(es): ${names.join(", ")}`);
    }

    // Settings drift on an index that already holds documents is a different animal:
    // applying it forces a full reindex, so that stays an operator's call.
    const drifted = drift.filter((d) => !d.missing);
    if (drifted.length > 0) throw new SettingsNotMigratedError(drifted.map((d) => d.index));
  }

  const rejects: RejectLog[] = [];
  let quarantined = 0;

  const onReject = async (r: Rejection): Promise<void> => {
    if (r.dropped) {
      quarantined += r.docs.length;
      await deps.outbox.quarantine(r.docs, r.reason);
    }
    // Logged as it happens: a drain of twenty batches takes minutes, and the job's own
    // completion event is far too late to tell you which push Meili is refusing.
    log(
      `meili refused ${r.docs.length} ${r.index} doc(s)` +
        `${r.dropped ? " — quarantined" : ", halving and retrying"}: ${r.reason}` +
        ` [payload ${r.payloadBytes}B` +
        (r.atOffset ? `, at column ${r.atOffset.column}: ${JSON.stringify(r.atOffset.excerpt)}` : "") +
        "]",
    );
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

    const depth = await deps.outbox.depth();
    if (depth > 0) log(`meili drain starting: ${depth} queued, up to ${maxBatches} batches`);

    for (let i = 0; i < maxBatches; i++) {
      const batch = await deps.outbox.peek(batchSize);
      if (batch.length === 0) break;

      const started = Date.now();
      await syncTheses(deps.client, batch, { waitForTasks: true, onReject });
      await deps.outbox.commit(batch.length);
      pushed += batch.length;
      batches++;
      log(
        `meili batch ${batches}/${maxBatches}: ${batch.length} docs in ` +
          `${Math.round((Date.now() - started) / 1000)}s, ${await deps.outbox.depth()} left`,
      );
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
