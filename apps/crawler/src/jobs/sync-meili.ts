import type { KnownDocs, MeiliSearch, Rejection } from "@tezara/meili";
import { INDEXES, applySettings, settleTaskQueue, syncTheses, verifySettings } from "@tezara/meili";
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
 * How long one drain runs before returning.
 *
 * The dedicated drainer loop calls this again immediately while work remains, so the
 * budget is a checkpoint, not a cap: it bounds how much progress a redeploy can lose
 * and gives the log a completion line at a useful interval.
 */
const DEFAULT_BUDGET_MS = 5 * 60_000;

/** Enough to diagnose; not so many that a bad batch floods the log. */
const MAX_LOGGED_REJECTS = 5;

const n = (value: number) => value.toLocaleString("en-US");

/**
 * Drain the outbox into Meili.
 *
 * Commit-after-push: if the push throws, nothing is committed and the same batch is
 * retried on the next run. That makes a partial failure a duplicate write (harmless —
 * Meili upserts by primary key) rather than a lost thesis.
 *
 * Held under the target's drain lock: the service runs one drainer, but the backfill
 * CLI can drain concurrently, and peek/commit is only safe for one drainer at a time.
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
  // The theses index's own batch size, so each index costs exactly one task per batch:
  // a smaller number just multiplies the fixed per-task cost across more of them.
  // ~10K theses is ~40MB of payload, comfortably under Meili's 100MB default cap.
  const batchSize = params.batchSize ?? INDEXES.theses.batchSize;
  const maxBatches = params.maxBatches ?? Number.POSITIVE_INFINITY;
  const budgetMs = params.budgetMs ?? DEFAULT_BUDGET_MS;
  const log = deps.log ?? (() => {});

  const rejects: RejectLog[] = [];
  let quarantined = 0;

  const onReject = async (r: Rejection): Promise<void> => {
    if (r.dropped) {
      quarantined += r.docs.length;
      await deps.outbox.quarantine("meili", r.docs, r.reason);
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

  const drained = await deps.outbox.drain("meili", async () => {
    let pushed = 0;
    let batches = 0;

    const depth = await deps.outbox.depth("meili");
    if (depth === 0) return { pushed, batches };
    log(`meili drain starting: ${n(depth)} queued, up to ${Math.round(budgetMs / 1000)}s`);

    // Inside the lock, so a drainer that loses the race does no work at all rather
    // than spending a round trip verifying settings it will not use.
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

    // Interrupted drains leave duplicate submissions queued in Meili; pushing behind
    // them re-creates the pile-up this exists to clear. See settleTaskQueue.
    await settleTaskQueue(deps.client, { log });

    const deadline = Date.now() + budgetMs;
    for (let i = 0; i < maxBatches; i++) {
      if (Date.now() >= deadline) {
        budgetExpired = true;
        break;
      }
      const batch = await deps.outbox.peek("meili", batchSize);
      if (batch.length === 0) break;

      const started = Date.now();
      await syncTheses(deps.client, batch, { waitForTasks: true, onReject, known: deps.known, log });
      await deps.outbox.commit("meili", batch.map((t) => t.id));
      pushed += batch.length;
      batches++;
      log(
        `meili batch ${batches}: ${n(batch.length)} docs in ` +
          `${Math.round((Date.now() - started) / 1000)}s, ${n(await deps.outbox.depth("meili"))} left`,
      );
    }

    return { pushed, batches };
  });

  if (drained === null) {
    return {
      pushed: 0,
      batches: 0,
      remaining: await deps.outbox.depth("meili"),
      skipped: "another drainer holds the lock",
    };
  }

  const remaining = await deps.outbox.depth("meili");
  return {
    ...drained,
    remaining,
    ...(budgetExpired && remaining > 0 ? { budgetExpired } : {}),
    ...(quarantined > 0 ? { quarantined } : {}),
    ...(rejects.length > 0 ? { rejects } : {}),
  };
}
