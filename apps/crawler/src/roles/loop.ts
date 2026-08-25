import type { ClickHouseClient } from "@tezara/clickhouse";
import type { JobContext } from "../jobs/context.ts";
import type { ChScanStore } from "../state/ch-scan.ts";
import type { Outbox } from "../state/outbox.ts";
import type { Session } from "../yok/session.ts";
import { refreshIds, scanRange, type CrawlCounts } from "../jobs/crawl.ts";
import { discoverHead } from "../jobs/discover-head.ts";
import { reconcileProjections } from "../jobs/reconcile-projections.ts";
import { reconcileYear } from "../jobs/reconcile-year.ts";
import { syncClickhouse } from "../jobs/sync-clickhouse.ts";
import { syncMeili } from "../jobs/sync-meili.ts";

/**
 * The crawler's work, planned in-process.
 *
 * There is no job queue. The queue this replaces was re-derived from durable state by a
 * scheduler tick every minute anyway — the pending set was a cache of "what to do
 * next", plus leases, a reaper and a priority workaround to defend N processes that
 * were actually one process. A planner that answers "what next?" directly off the same
 * state needs none of that: a crash loses nothing but the unit in flight, which the
 * next pass re-derives (backfill: cursor + skip-recorded; refresh: still due; sync: the
 * outbox is still there).
 */
export type WorkUnit =
  | { kind: "backfill"; from: number; to: number }
  | { kind: "refresh"; ids: number[] }
  | { kind: "discover-head" }
  | { kind: "reconcile-year"; year: number }
  | { kind: "reconcile-projections" };

export type LoopPolicy = {
  /** Highest thesis id worth backfilling to; discover-head tracks the live head. */
  maxThesisId: number;
  /** Ids per backfill/refresh unit. */
  chunkSize: number;
  discoverEveryMs: number;
  /** How often to reconcile ONE year; the corpus cycles through over time. */
  reconcileEveryMs: number;
  /** Inclusive year range to cycle through. */
  reconcileYears: { from: number; to: number };
  /** How often to compare the projections against the marks and re-queue losses. */
  projectionsEveryMs: number;
};

export const DEFAULT_POLICY: LoopPolicy = {
  // Measured 2026-08: max Tez No is 1,020,391. Widened so new ids are still reached
  // if discover-head has not run recently.
  maxThesisId: 1_030_000,
  // ~50 ids at 3 requests each is a couple of minutes per unit: small enough that a
  // crash or redeploy costs little repeated work.
  chunkSize: 50,
  discoverEveryMs: 30 * 60_000,
  // One year every 20 minutes cycles the whole 1959-2026 corpus in about a day.
  reconcileEveryMs: 20 * 60_000,
  reconcileYears: { from: 1959, to: 2026 },
  projectionsEveryMs: 24 * 60 * 60_000,
};

/**
 * Hands out the next unit of work. One instance, shared by every lane; `next()` is
 * serialized internally so two lanes can never be planned the same ids.
 */
export class Planner {
  readonly #scan: ChScanStore;
  readonly #outbox: Outbox;
  readonly #policy: LoopPolicy;
  /** Refresh ids handed out and not yet completed. */
  readonly #inFlight = new Set<number>();
  /** Singleton units currently running. */
  readonly #busy = new Set<WorkUnit["kind"]>();
  #chain: Promise<unknown> = Promise.resolve();

  constructor(scan: ChScanStore, outbox: Outbox, policy: LoopPolicy = DEFAULT_POLICY) {
    this.#scan = scan;
    this.#outbox = outbox;
    this.#policy = policy;
  }

  next(now = Date.now()): Promise<WorkUnit | null> {
    const planned = this.#chain.then(() => this.#plan(now), () => this.#plan(now));
    this.#chain = planned;
    return planned;
  }

  /** Give back a finished (or failed) unit so its ids and singleton slot free up. */
  complete(unit: WorkUnit): void {
    this.#busy.delete(unit.kind);
    if (unit.kind === "refresh") {
      for (const id of unit.ids) this.#inFlight.delete(id);
    }
  }

  async #elapsed(mark: string, everyMs: number, now: number): Promise<boolean> {
    return now - ((await this.#scan.watermark(mark)) ?? 0) >= everyMs;
  }

  async #plan(now: number): Promise<WorkUnit | null> {
    const p = this.#policy;

    // Cheap, rare units first — they must not queue behind a 19-day backfill.
    if (
      !this.#busy.has("discover-head") &&
      (await this.#elapsed("discover:lastRun", p.discoverEveryMs, now))
    ) {
      this.#busy.add("discover-head");
      // Stamped at hand-out so a slow probe is not handed out twice; buffered raises
      // are flushed with the unit's own writes.
      await this.#scan.raiseWatermark("discover:lastRun", now);
      return { kind: "discover-head" };
    }

    if (
      !this.#busy.has("reconcile-year") &&
      (await this.#elapsed("reconcile:lastRun", p.reconcileEveryMs, now))
    ) {
      this.#busy.add("reconcile-year");
      const span = p.reconcileYears.to - p.reconcileYears.from + 1;
      const cursor = (await this.#scan.watermark("reconcile:cursor")) ?? 0;
      const year = p.reconcileYears.from + (cursor % span);
      await this.#scan.raiseWatermark("reconcile:cursor", cursor + 1);
      await this.#scan.raiseWatermark("reconcile:lastRun", now);
      return { kind: "reconcile-year", year };
    }

    if (
      !this.#busy.has("reconcile-projections") &&
      (await this.#elapsed("projections:lastRun", p.projectionsEveryMs, now)) &&
      // Only against drained targets: in-flight outbox work would read as "missing".
      (await this.#outbox.depth("meili")) === 0 &&
      (await this.#outbox.depth("clickhouse")) === 0
    ) {
      this.#busy.add("reconcile-projections");
      await this.#scan.raiseWatermark("projections:lastRun", now);
      return { kind: "reconcile-projections" };
    }

    // Re-visits before new ground: error retries and forced re-pushes are time-critical
    // in a way one more backfill chunk is not. Over-fetch so in-flight ids still leave
    // a full chunk.
    const due = (await this.#scan.due(p.chunkSize + this.#inFlight.size, now))
      .filter((id) => !this.#inFlight.has(id))
      .slice(0, p.chunkSize);
    if (due.length > 0) {
      for (const id of due) this.#inFlight.add(id);
      return { kind: "refresh", ids: due };
    }

    // The backfill. The cursor advances at hand-out; a unit that dies is skipped over,
    // and the projection reconcile sweeps up ids the cursor passed but nothing recorded.
    const cursor = (await this.#scan.watermark("backfill")) ?? 1;
    if (cursor <= p.maxThesisId) {
      const to = Math.min(cursor + p.chunkSize - 1, p.maxThesisId);
      await this.#scan.raiseWatermark("backfill", to + 1);
      return { kind: "backfill", from: cursor, to };
    }

    return null;
  }
}

async function runUnit(
  ctx: JobContext,
  unit: WorkUnit,
  signal?: AbortSignal,
): Promise<unknown> {
  switch (unit.kind) {
    case "backfill":
      return scanRange(ctx, { from: unit.from, to: unit.to }, signal);
    case "refresh":
      return refreshIds(ctx, { ids: unit.ids }, signal);
    case "discover-head":
      return discoverHead(ctx, {}, signal);
    case "reconcile-year":
      return reconcileYear(ctx, { year: unit.year });
    case "reconcile-projections": {
      if (!ctx.clickhouse) return { skipped: "no clickhouse client configured" };
      return reconcileProjections({
        clickhouse: ctx.clickhouse,
        meili: ctx.meili,
        scan: ctx.scan,
        log: ctx.log,
      });
    }
  }
}

export type LoopEvent = {
  unit: WorkUnit;
  outcome: "ok" | "error";
  detail?: unknown;
  elapsedMs: number;
};

export type LoopOptions = {
  signal?: AbortSignal;
  /** How many crawl lanes run at once. Each gets its own YÖK session. */
  concurrency?: number;
  /**
   * Opens a fresh YÖK session for a lane.
   *
   * SearchTez stores the query in the server-side session, so two concurrent requests
   * sharing one JSESSIONID overwrite each other and both get whichever search landed
   * last — a valid-looking page for the wrong thesis. Sessions are therefore per-lane,
   * never shared.
   */
  newSession?: () => Promise<Session>;
  onEvent?: (event: LoopEvent) => void;
  /** Stop once the planner runs dry — used by tests. */
  exitWhenIdle?: boolean;
};

const IDLE_SLEEP_MS = 2_000;
const ERROR_SLEEP_MS = 10_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * The crawl lanes. Concurrency matters because a single lane is latency-bound: three
 * sequential round trips per thesis at ~500ms each caps one lane at ~0.6 theses/s no
 * matter what YÖK could serve. Lanes multiply that; the circuit breaker is the shared
 * brake when YÖK stops answering.
 */
export async function runCrawlLanes(
  ctx: JobContext,
  planner: Planner,
  opts: LoopOptions = {},
): Promise<void> {
  const { signal, onEvent } = opts;
  const concurrency = Math.max(1, opts.concurrency ?? 1);

  const lane = async (): Promise<void> => {
    const session = await opts.newSession?.();
    const laneCtx = session ? { ...ctx, session } : ctx;

    try {
      while (!signal?.aborted) {
        const unit = await planner.next();
        if (!unit) {
          if (opts.exitWhenIdle) return;
          await sleep(IDLE_SLEEP_MS);
          continue;
        }

        const startedAt = Date.now();
        let failed = false;
        try {
          const detail = await runUnit(laneCtx, unit, signal);
          onEvent?.({ unit, outcome: "ok", detail, elapsedMs: Date.now() - startedAt });
        } catch (err) {
          // No retry machinery: per-id failures were recorded as `error` state inside
          // the unit and come back as due; a unit that threw outright (breaker open,
          // store down) re-derives on a later pass. Sleep so an open breaker does not
          // spin the lane.
          failed = true;
          onEvent?.({
            unit,
            outcome: "error",
            detail: err instanceof Error ? err.message : String(err),
            elapsedMs: Date.now() - startedAt,
          });
        } finally {
          // Marks written before completion, so a just-recorded id can never be
          // re-planned as still due.
          await ctx.scan.flush().catch(() => {});
          planner.complete(unit);
        }
        if (failed) await sleep(ERROR_SLEEP_MS);
      }
    } finally {
      await session?.close().catch(() => {});
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => lane()));
}

export type DrainerDeps = {
  outbox: Outbox;
  scan: ChScanStore;
  meili?: JobContext["meili"];
  dimensions?: JobContext["dimensions"];
  clickhouse?: ClickHouseClient;
  log?: (message: string) => void;
  onEvent?: (event: { target: "meili" | "clickhouse"; detail: unknown }) => void;
};

/**
 * One dedicated drainer per projection target, instead of sync jobs competing with the
 * crawl for lanes. Each loops: drain what is queued, sleep briefly when empty, back off
 * when the target errors. The two run independently because the targets fail
 * independently — that was the point of per-target queues.
 */
export async function runDrainers(
  deps: DrainerDeps,
  opts: { signal?: AbortSignal } = {},
): Promise<void> {
  const { signal } = opts;
  const log = deps.log ?? (() => {});

  const loop = async (
    target: "meili" | "clickhouse",
    drain: () => Promise<{ remaining: number }>,
  ): Promise<void> => {
    let failures = 0;
    while (!signal?.aborted) {
      try {
        const result = await drain();
        failures = 0;
        // Marks and rebuild stamps raised during the drain are buffered in the store.
        await deps.scan.flush().catch(() => {});
        if (result.remaining === 0) await sleep(IDLE_SLEEP_MS);
      } catch (err) {
        failures++;
        const wait = Math.min(ERROR_SLEEP_MS * 2 ** (failures - 1), 5 * 60_000);
        log(
          `${target} drain failed (attempt ${failures}), retrying in ${wait / 1000}s: ` +
            `${err instanceof Error ? err.message : String(err)}`,
        );
        await sleep(wait);
      }
    }
  };

  const drainers: Promise<void>[] = [];
  if (deps.meili) {
    const client = deps.meili;
    drainers.push(
      loop("meili", async () => {
        const result = await syncMeili({
          client, outbox: deps.outbox, known: deps.dimensions, log: deps.log,
        });
        deps.onEvent?.({ target: "meili", detail: result });
        return result;
      }),
    );
  }
  if (deps.clickhouse) {
    const client = deps.clickhouse;
    drainers.push(
      loop("clickhouse", async () => {
        const result = await syncClickhouse({
          client, outbox: deps.outbox, marks: deps.scan, log: deps.log,
        });
        deps.onEvent?.({ target: "clickhouse", detail: result });
        // An empty drain still checks rebuild staleness; idle between checks.
        return { remaining: result.remaining };
      }),
    );
  }
  await Promise.all(drainers);
}
