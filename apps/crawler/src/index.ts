/**
 * The crawler. One process: it serves /health, /ready and /metrics, plans its own work,
 * crawls it, and drains the outbox into the projection targets. There is no job queue —
 * durable state (which ids were visited, watermarks) lives in ClickHouse, the transient
 * outbox buffer in Redis, and "what to do next" is derived in-process (see roles/loop).
 */
import { createClickhouseClient, migrate as migrateClickhouse } from "@tezara/clickhouse";
import { applySettings, createMeiliClient, verifySettings } from "@tezara/meili";
import { loadConfig } from "./config.ts";
import { error, info, warn } from "./log.ts";
import { buildLookups } from "./jobs/context.ts";
import { buildStatus, createApi } from "./roles/api.ts";
import { DEFAULT_POLICY, Planner, runCrawlLanes, runDrainers } from "./roles/loop.ts";
import { describeDrain, describeStatus, describeUnit } from "./roles/report.ts";
import { makeKeys } from "./state/keys.ts";
import { ChScanStore } from "./state/ch-scan.ts";
import { DimensionCache } from "./state/dimensions.ts";
import { Outbox } from "./state/outbox.ts";
import { ReconcileStore } from "./state/reconcile.ts";
import { createRedis } from "./state/redis.ts";
import { CircuitBreaker } from "./yok/breaker.ts";
import { redisGate } from "./yok/gate.ts";
import { openSession } from "./yok/session.ts";

const config = loadConfig();
const redis = createRedis(config.REDIS_URL);
const keys = makeKeys(config.CRAWLER_REDIS_PREFIX);

const clickhouse = createClickhouseClient({ url: config.CLICKHOUSE_URL });
const meili = createMeiliClient({
  host: config.MEILI_URL_INTERNAL,
  apiKey: config.MEILI_ADMIN_KEY,
});

const scan = new ChScanStore(clickhouse);
const outbox = new Outbox(redis, keys);
const dimensions = new DimensionCache(redis, keys);
const reconcile = new ReconcileStore(redis, keys);
const breaker = new CircuitBreaker(redis, keys, {
  failureThreshold: config.CRAWLER_BREAKER_THRESHOLD,
  cooldownMs: config.CRAWLER_BREAKER_COOLDOWN_MS,
});

const controller = new AbortController();

// ioredis emits errors on its own event emitter; unhandled, they take the process down.
// Reconnection is automatic, so log and let it recover.
redis.on("error", (err) => error(`redis: ${err.message}`));

process.on("unhandledRejection", (reason) => {
  error(`FATAL unhandled rejection: ${reason instanceof Error ? reason.stack : String(reason)}`);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  error(`FATAL uncaught exception: ${err instanceof Error ? err.stack : String(err)}`);
  process.exit(1);
});

const apiDeps = {
  redis, scan, outbox, breaker, reconcile, meili,
  maxThesisId: config.CRAWLER_MAX_THESIS_ID,
};
const server = createApi(apiDeps);
server.listen(config.PORT, () => info(`listening on :${config.PORT}`));

/**
 * A per-unit log never shows totals, and totals are the only way to tell a crawl that is
 * working from one that is busy failing. One summary line a minute, always.
 */
const STATUS_EVERY_MS = 60_000;
let idsCrawledSinceStatus = 0;

const statusTimer = setInterval(() => {
  buildStatus(apiDeps)
    .then((status) => {
      info(describeStatus(status, idsCrawledSinceStatus));
      idsCrawledSinceStatus = 0;
    })
    .catch((err: unknown) => warn(`status unavailable: ${String(err)}`));
}, STATUS_EVERY_MS);
statusTimer.unref();

async function shutdown(signal: string): Promise<void> {
  info(`${signal} — shutting down`);
  controller.abort();
  server.close();
  // Buffered scan marks not yet flushed are simply re-crawled next run; the outbox and
  // its queues live in Redis and survive as they are.
  await scan.flush().catch(() => {});
  await redis.quit().catch(() => {});
  await clickhouse.close().catch(() => {});
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

/** How many records we hold for a year — the reconciliation oracle's other half. */
const countHeldForYear = async (year: number) => {
  const res = await clickhouse.query({
    query: "SELECT count() AS c FROM theses FINAL WHERE year = {year:UInt32}",
    query_params: { year },
    format: "JSONEachRow",
  });
  const rows = await res.json<{ c: string }>();
  return Number(rows[0]?.c ?? 0);
};

/**
 * Bring the projection targets up to date before crawling.
 *
 * Pointing the crawler at a fresh Meili or ClickHouse should be all it takes. Never
 * fatal: a target that is unreachable at boot is a target that will be reachable later,
 * and the drainers retry on their own — taking the process down would only stop the
 * crawl as well. (The ClickHouse migration IS load-bearing for the crawl itself now —
 * crawl_state lives there — but the lanes fail soft and retry, so the same rule holds.)
 *
 * What it will NOT do is change settings on an index that already holds documents: that
 * forces a full reindex, so it stays a deliberate `pnpm --filter @tezara/crawler migrate`.
 */
async function prepareTargets(): Promise<void> {
  try {
    const ran = await migrateClickhouse(clickhouse);
    info(
      ran.length > 0
        ? `clickhouse: applied ${ran.length} migration(s): ${ran.join(", ")}`
        : "clickhouse: schema already up to date",
    );
  } catch (err) {
    warn(`clickhouse: could not migrate — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const drift = await verifySettings(meili);
    const absent = drift.filter((d) => d.missing).map((d) => d.index);
    if (absent.length > 0) {
      await applySettings(meili, { only: absent, waitForTasks: true });
      info(`meili: created and configured ${absent.length} index(es): ${absent.join(", ")}`);
    } else {
      info("meili: all indexes present");
    }

    const drifted = drift.filter((d) => !d.missing).map((d) => d.index);
    if (drifted.length > 0) {
      warn(
        `meili: settings drift on ${drifted.join(", ")} — syncs will fail until ` +
          "`pnpm --filter @tezara/crawler migrate` is run (it forces a reindex)",
      );
    }
  } catch (err) {
    warn(`meili: could not verify settings — ${err instanceof Error ? err.message : String(err)}`);
  }
}

const planner = new Planner(scan, outbox, {
  ...DEFAULT_POLICY,
  maxThesisId: config.CRAWLER_MAX_THESIS_ID,
});

/**
 * Establishing a YÖK session can fail — maintenance, blocked egress, slow DNS. That must
 * not take the process down: /metrics still needs serving, so the crawl loop retries on
 * its own with backoff.
 */
async function crawlForever(): Promise<void> {
  let attempt = 0;

  while (!controller.signal.aborted) {
    try {
      // One throwaway session to load the subject taxonomy; each lane opens its own.
      info("fetching subject taxonomy…");
      const bootstrap = await openSession({ gate: redisGate(breaker) });
      const lookups = await buildLookups(bootstrap);
      await bootstrap.close().catch(() => {});
      info(
        `taxonomy loaded (${lookups.subjectEnByTr.size} subjects), ` +
          `starting ${config.CRAWLER_CONCURRENCY} lanes`,
      );
      attempt = 0;

      await runCrawlLanes(
        {
          session: undefined as never, // each lane supplies its own
          scan, lookups, outbox, dimensions, meili, clickhouse,
          reconcile, countHeldForYear,
          log: info,
        },
        planner,
        {
          signal: controller.signal,
          concurrency: config.CRAWLER_CONCURRENCY,
          newSession: () => openSession({ gate: redisGate(breaker) }),
          onEvent: ({ unit, outcome, detail, elapsedMs }) => {
            if (unit.kind !== "reconcile-year" && outcome === "ok") {
              idsCrawledSinceStatus += (detail as { ok?: number }).ok ?? 0;
            }
            const line = describeUnit(unit, outcome, detail, elapsedMs);
            if (line !== null) (outcome === "ok" ? info : warn)(line);
          },
        },
      );
    } catch (err) {
      attempt++;
      const wait = Math.min(30_000 * 2 ** (attempt - 1), 5 * 60_000);
      error(
        `crawl loop failed (attempt ${attempt}), retrying in ${wait / 1000}s: ` +
          `${err instanceof Error ? err.message : String(err)}`,
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

/** The drainers restart on their own the same way the crawl does. */
async function drainForever(): Promise<void> {
  let attempt = 0;
  while (!controller.signal.aborted) {
    try {
      await runDrainers(
        {
          outbox, scan, meili, dimensions, clickhouse, log: info,
          onEvent: ({ target, detail }) => {
            const line = describeDrain(target, detail);
            if (line !== null) info(line);
          },
        },
        { signal: controller.signal },
      );
      return; // only exits when aborted
    } catch (err) {
      attempt++;
      const wait = Math.min(30_000 * 2 ** (attempt - 1), 5 * 60_000);
      error(
        `drainers failed (attempt ${attempt}), retrying in ${wait / 1000}s: ` +
          `${err instanceof Error ? err.message : String(err)}`,
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

await prepareTargets();

try {
  await Promise.all([crawlForever(), drainForever()]);
} catch (err) {
  error(`FATAL: ${err instanceof Error ? err.stack : String(err)}`);
  process.exit(1);
}
