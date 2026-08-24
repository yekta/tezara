import type { KnownDocs, MeiliSearch, Rejection } from "@tezara/meili";
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

export type SyncMeiliParams = {
  batchSize?: number;
  /** Hard cap on batches, for the CLI and for tests. Normally the budget is the bound. */
  maxBatches?: number;
  /** Stop starting new batches after this long, so the lane is not held indefinitely. */
  budgetMs?: number;
};

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
  /**
   * The drain stopped on its time budget with the outbox still holding work — as
   * opposed to stopping because it had emptied it. Only this warrants re-arming: a
   * `remaining` that is non-zero merely because the crawl pushed more while the last
   * batch was in flight is what the next scheduler tick is for.
   */
  budgetExpired?: boolean;
  /** Documents Meili refused one at a time; parked in the outbox's dead list. */
  quarantined?: number;
  /** First few refusals, with enough context to tell a bad record from a bad request. */
  rejects?: RejectLog[];
  skipped?: string;
};

/**
 * How long one job drains for before handing its lane back.
 *
 * The drain used to stop after a fixed twenty batches, which on a backlog meant it quit
 * with work still queued and then waited for the scheduler's next tick to be told to
 * carry on. Meanwhile the other lanes had already claimed and skipped every sync job the
 * ticks in between had queued, so there was nothing left to pick up: the one drainer sat
 * idle while the outbox grew. Now it drains until the outbox is empty, and a job that
 * runs out of budget re-queues itself immediately (see the worker) instead of idling.
 *
 * Five minutes is a compromise: long enough that the re-queue is rare, short enough that
 * a lane comes back for the crawl, a redeploy does not lose much work, and the job's
 * completion still shows up in the log at a useful interval.
 */
const DEFAULT_BUDGET_MS = 5 * 60_000;

/** Enough to diagnose; not so many that a bad batch floods the log. */
const MAX_LOGGED_REJECTS = 5;

const n = (value: number) => value.toLocaleString("en-US");

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
  deps: {
    client: MeiliSearch;
    outbox: Outbox;
    /** Lets the push skip dimension names Meili already holds; safe to omit. */
    known?: KnownDocs;
    log?: (message: string) => void;
  },
  params: SyncMeiliParams = {},
): Promise<SyncMeiliResult> {
  // Matches INDEXES.theses.batchSize, so each index costs exactly one task per batch:
  // a smaller number just multiplies the fixed per-task cost across more of them.
  const batchSize = params.batchSize ?? 2_000;
  const maxBatches = params.maxBatches ?? Number.POSITIVE_INFINITY;
  const budgetMs = params.budgetMs ?? DEFAULT_BUDGET_MS;
  const log = deps.log ?? (() => {});

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

  let budgetExpired = false;

  const drained = await deps.outbox.drain(async () => {
    let pushed = 0;
    let batches = 0;

    const depth = await deps.outbox.depth();
    if (depth === 0) return { pushed, batches };
    log(`meili drain starting: ${n(depth)} queued, up to ${Math.round(budgetMs / 1000)}s`);

    // Inside the lock, so the nine lanes that lose the race do no work at all rather
    // than each spending a round trip verifying settings they will not use.
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

    const deadline = Date.now() + budgetMs;
    for (let i = 0; i < maxBatches; i++) {
      if (Date.now() >= deadline) {
        budgetExpired = true;
        break;
      }
      const batch = await deps.outbox.peek(batchSize);
      if (batch.length === 0) break;

      const started = Date.now();
      await syncTheses(deps.client, batch, { waitForTasks: true, onReject, known: deps.known });
      await deps.outbox.commit(batch.length);
      pushed += batch.length;
      batches++;
      log(
        `meili batch ${batches}: ${n(batch.length)} docs in ` +
          `${Math.round((Date.now() - started) / 1000)}s, ${n(await deps.outbox.depth())} left`,
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

  const remaining = await deps.outbox.depth();
  return {
    ...drained,
    remaining,
    ...(budgetExpired && remaining > 0 ? { budgetExpired } : {}),
    ...(quarantined > 0 ? { quarantined } : {}),
    ...(rejects.length > 0 ? { rejects } : {}),
  };
}
