import type { Redis } from "ioredis";
import type { Queue } from "../queue/queue.ts";
import type { Keys } from "../state/keys.ts";
import type { ScanStore } from "../state/scan.ts";

/**
 * Exactly-one-scheduler, enforced by a Redis lock with a TTL heartbeat.
 *
 * A crashed scheduler's lock simply expires — there is no cleanup path to get wrong.
 * The tick itself is idempotent (enqueue dedupes on (kind, params)), so a brief overlap
 * during a redeploy re-asserts the same work rather than duplicating it.
 */
export class Leader {
  readonly #redis: Redis;
  readonly #key: string;
  readonly #id: string;
  readonly #ttlMs: number;
  #timer?: NodeJS.Timeout;

  constructor(redis: Redis, keys: Keys, opts: { ttlMs?: number; id?: string } = {}) {
    this.#redis = redis;
    this.#key = keys.lock("scheduler");
    this.#ttlMs = opts.ttlMs ?? 30_000;
    this.#id = opts.id ?? `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async acquire(): Promise<boolean> {
    const ok = await this.#redis.set(this.#key, this.#id, "PX", this.#ttlMs, "NX");
    return ok === "OK";
  }

  /** Extend only if we still hold it — never steal another scheduler's lock. */
  async renew(): Promise<boolean> {
    const lua = `
      if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('PEXPIRE', KEYS[1], ARGV[2])
      end
      return 0`;
    return (await this.#redis.eval(lua, 1, this.#key, this.#id, String(this.#ttlMs))) === 1;
  }

  startHeartbeat(onLost: () => void): void {
    // An async setInterval callback has nowhere to put a rejection: if Redis blips the
    // renew throws and the process dies on an unhandled rejection. A renew we cannot
    // complete is a lock we must assume we no longer hold, so treat it as lost and
    // re-acquire on the next pass.
    this.#timer = setInterval(() => {
      this.renew().then(
        (ok) => { if (!ok) onLost(); },
        () => onLost(),
      );
    }, Math.floor(this.#ttlMs / 3));
  }

  async release(): Promise<void> {
    if (this.#timer) clearInterval(this.#timer);
    const lua = `
      if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end
      return 0`;
    await this.#redis.eval(lua, 1, this.#key, this.#id);
  }
}

export type SchedulerPolicy = {
  /** Highest thesis id known to exist upstream; bounds the backfill. */
  maxThesisId: number;
  /** Ids per scan-id-range job. */
  chunkSize: number;
  /** How many backfill chunks to keep queued at once. */
  backfillDepth: number;
  discoverHeadEveryMs: number;
  syncEveryMs: number;
  /** How often to reconcile ONE year; the corpus cycles through over time. */
  reconcileEveryMs: number;
  /** Inclusive year range to cycle through. */
  reconcileYears: { from: number; to: number };
};

export const DEFAULT_POLICY: SchedulerPolicy = {
  // Measured 2026-08: max Tez No is 1,020,391. Widened so new ids are still reached
  // if discover-head has not run recently.
  maxThesisId: 1_030_000,
  // ~50 ids at 3 requests each is a couple of minutes per job: small enough that no
  // single job monopolises a worker and starves sync-meili.
  chunkSize: 50,
  backfillDepth: 20,
  discoverHeadEveryMs: 30 * 60_000,
  syncEveryMs: 60_000,
  // One year every 20 minutes cycles the whole 1959-2026 corpus in about a day.
  reconcileEveryMs: 20 * 60_000,
  reconcileYears: { from: 1959, to: 2026 },
};

export type TickReport = {
  backfillQueued: number;
  refreshQueued: number;
  discoverQueued: boolean;
  syncQueued: boolean;
  reconcileQueued: number | null;
};

/**
 * One scheduling pass. Everything it enqueues is deduped by (kind, params), so running
 * this every minute forever is safe and cheap.
 */
export async function tick(
  deps: { queue: Queue; scan: ScanStore },
  policy: SchedulerPolicy = DEFAULT_POLICY,
  now = Date.now(),
): Promise<TickReport> {
  const report: TickReport = {
    backfillQueued: 0, refreshQueued: 0, discoverQueued: false, syncQueued: false,
    reconcileQueued: null,
  };

  // 1. Keep the backfill topped up, starting just past the highest scanned id.
  //
  // Deliberately not gated on how far behind the projections are. The outboxes exist so
  // that a slow or absent target costs the crawl nothing; throttling the crawl on outbox
  // depth would hand that decoupling back, and turn "Meili is unwell" into "we stopped
  // collecting theses" — which is the one thing here that cannot be caught up later.
  const { pending } = await deps.queue.stats();
  if (pending < policy.backfillDepth) {
    const cursor = (await deps.scan.watermark("backfill")) ?? 1;
    let from = cursor;
    for (let i = pending; i < policy.backfillDepth && from <= policy.maxThesisId; i++) {
      const to = Math.min(from + policy.chunkSize - 1, policy.maxThesisId);
      await deps.queue.enqueue("scan-id-range", { from, to });
      report.backfillQueued++;
      from = to + 1;
    }
    if (from > cursor) await deps.scan.raiseWatermark("backfill", from);
  }

  // 2. Re-visit ids whose tier TTL has elapsed.
  const due = await deps.scan.due(policy.chunkSize, now);
  if (due.length > 0) {
    await deps.queue.enqueue("scan-id-range", { from: due[0]!, to: due[due.length - 1]! });
    report.refreshQueued = due.length;
  }

  // 3. Live tail: new theses always take ids above the watermark.
  const lastDiscover = (await deps.scan.watermark("discover:lastRun")) ?? 0;
  if (now - lastDiscover >= policy.discoverHeadEveryMs) {
    await deps.queue.enqueue("discover-head", { at: Math.floor(now / policy.discoverHeadEveryMs) });
    await deps.scan.raiseWatermark("discover:lastRun", now);
    report.discoverQueued = true;
  }

  // 4. Drain the outboxes into the projection targets.
  const lastSync = (await deps.scan.watermark("sync:lastRun")) ?? 0;
  if (now - lastSync >= policy.syncEveryMs) {
    const at = Math.floor(now / policy.syncEveryMs);
    await deps.queue.enqueue("sync-meili", { at });
    await deps.queue.enqueue("sync-clickhouse", { at });
    await deps.scan.raiseWatermark("sync:lastRun", now);
    report.syncQueued = true;
  }

  // 5. Reconcile one year per interval, cycling through the corpus.
  const lastRecon = (await deps.scan.watermark("reconcile:lastRun")) ?? 0;
  if (now - lastRecon >= policy.reconcileEveryMs) {
    const span = policy.reconcileYears.to - policy.reconcileYears.from + 1;
    const cursor = (await deps.scan.watermark("reconcile:cursor")) ?? 0;
    const year = policy.reconcileYears.from + (cursor % span);
    await deps.queue.enqueue("reconcile-year", { year });
    // raiseWatermark is monotonic, so the cursor is stored as a plain counter.
    await deps.scan.raiseWatermark("reconcile:cursor", cursor + 1);
    await deps.scan.raiseWatermark("reconcile:lastRun", now);
    report.reconcileQueued = year;
  }

  return report;
}

export async function runScheduler(
  deps: { redis: Redis; keys: Keys; queue: Queue; scan: ScanStore },
  opts: { policy?: SchedulerPolicy; intervalMs?: number; signal?: AbortSignal;
          onTick?: (r: TickReport) => void } = {},
): Promise<void> {
  const leader = new Leader(deps.redis, deps.keys);
  const intervalMs = opts.intervalMs ?? 60_000;
  let lost = false;

  while (!opts.signal?.aborted) {
    if (!(await leader.acquire())) {
      await new Promise((r) => setTimeout(r, intervalMs));
      continue;
    }
    leader.startHeartbeat(() => { lost = true; });

    try {
      while (!opts.signal?.aborted && !lost) {
        opts.onTick?.(await tick(deps, opts.policy ?? DEFAULT_POLICY));
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    } finally {
      await leader.release();
      lost = false;
    }
  }
}
