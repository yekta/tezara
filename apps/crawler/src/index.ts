/**
 * The crawler. One process: it serves /health, /ready and /metrics, schedules work, and
 * runs it. There is nothing to configure beyond the connection URLs.
 */
import { createClickhouseClient } from "@tezara/clickhouse";
import { createMeiliClient } from "@tezara/meili";
import { loadConfig } from "./config.ts";
import { buildLookups } from "./jobs/context.ts";
import { Queue } from "./queue/queue.ts";
import { createApi } from "./roles/api.ts";
import { DEFAULT_POLICY, runScheduler } from "./roles/scheduler.ts";
import { runWorker } from "./roles/worker.ts";
import { makeKeys } from "./state/keys.ts";
import { Outbox } from "./state/outbox.ts";
import { ReconcileStore } from "./state/reconcile.ts";
import { createRedis } from "./state/redis.ts";
import { ScanStore } from "./state/scan.ts";
import { CircuitBreaker } from "./yok/breaker.ts";
import { redisGate } from "./yok/gate.ts";
import { openSession } from "./yok/session.ts";

const config = loadConfig();
const redis = createRedis(config.REDIS_URL);
const keys = makeKeys(config.CRAWLER_REDIS_PREFIX);

const queue = new Queue(redis, keys);
const scan = new ScanStore(redis, keys);
const outbox = new Outbox(redis, keys, "meili");
const clickhouseOutbox = new Outbox(redis, keys, "clickhouse");
const reconcile = new ReconcileStore(redis, keys);
const breaker = new CircuitBreaker(redis, keys, {
  failureThreshold: config.CRAWLER_BREAKER_THRESHOLD,
  cooldownMs: config.CRAWLER_BREAKER_COOLDOWN_MS,
});

const meili = createMeiliClient({
  host: config.MEILI_URL_INTERNAL,
  apiKey: config.MEILI_ADMIN_KEY,
});
const clickhouse = createClickhouseClient({
  url: config.CLICKHOUSE_URL,
  database: config.CLICKHOUSE_DATABASE,
});

const controller = new AbortController();

// ioredis emits errors on its own event emitter; unhandled, they take the process down.
// Reconnection is automatic, so log and let it recover.
redis.on("error", (err) => console.error("[redis]", err.message));

process.on("unhandledRejection", (reason) => {
  console.error("[crawler] FATAL unhandled rejection:", reason);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error("[crawler] FATAL uncaught exception:", err);
  process.exit(1);
});

const server = createApi({
  redis, queue, scan, outbox, clickhouseOutbox, breaker, reconcile,
  maxThesisId: config.CRAWLER_MAX_THESIS_ID,
});
server.listen(config.PORT, () => console.error(`[crawler] listening on :${config.PORT}`));

async function shutdown(signal: string): Promise<void> {
  console.error(`[crawler] ${signal} — shutting down`);
  controller.abort();
  server.close();
  // In-flight jobs keep their lease; if we die before completing them the reaper
  // requeues them, so there is nothing to flush here.
  await redis.quit().catch(() => {});
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
 * Establishing a YÖK session can fail — maintenance, blocked egress, slow DNS. That must
 * not take the process down: /metrics still needs serving and work still needs queueing,
 * so the crawl loop retries on its own with backoff.
 */
async function crawlForever(): Promise<void> {
  let attempt = 0;

  while (!controller.signal.aborted) {
    try {
      console.error("[crawler] opening YÖK session…");
      const session = await openSession({ gate: redisGate(breaker) });
      console.error("[crawler] session established, fetching subject taxonomy…");
      const lookups = await buildLookups(session);
      console.error(`[crawler] taxonomy loaded (${lookups.subjectEnByTr.size} subjects)`);
      attempt = 0;

      await runWorker(
        {
          session, queue, scan, lookups, outbox, clickhouseOutbox, meili, clickhouse,
          reconcile, countHeldForYear,
        },
        queue,
        {
          signal: controller.signal,
          concurrency: config.CRAWLER_CONCURRENCY,
          onEvent: ({ job, outcome, detail }) =>
            console.error(`[crawler] ${job.kind} -> ${outcome} ${JSON.stringify(detail)}`),
        },
      );
      await session.close().catch(() => {});
    } catch (err) {
      attempt++;
      const wait = Math.min(30_000 * 2 ** (attempt - 1), 5 * 60_000);
      console.error(
        `[crawler] crawl loop failed (attempt ${attempt}), retrying in ${wait / 1000}s:`,
        err instanceof Error ? err.message : err,
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

try {
  await Promise.all([
    runScheduler(
      { redis, keys, queue, scan },
      {
        signal: controller.signal,
        policy: { ...DEFAULT_POLICY, maxThesisId: config.CRAWLER_MAX_THESIS_ID },
        onTick: (r) => console.error(`[crawler] scheduled ${JSON.stringify(r)}`),
      },
    ),
    crawlForever(),
  ]);
} catch (err) {
  console.error("[crawler] FATAL:", err instanceof Error ? err.stack : err);
  process.exit(1);
}
