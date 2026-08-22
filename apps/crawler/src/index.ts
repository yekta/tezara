/**
 * One image, three roles selected by CRAWLER_ROLE.
 *   scheduler — exactly one instance, enqueues due work
 *   worker    — scale freely, claims and runs jobs
 *   api       — /health /ready /metrics
 */
import { createClickhouseClient } from "@tezara/clickhouse";
import { createMeiliClient } from "@tezara/meili";
import { loadConfig } from "./config.ts";
import { buildLookups } from "./jobs/context.ts";
import { createApi } from "./roles/api.ts";
import { runScheduler, DEFAULT_POLICY } from "./roles/scheduler.ts";
import { runWorker } from "./roles/worker.ts";
import { Queue } from "./queue/queue.ts";
import { makeKeys } from "./state/keys.ts";
import { Outbox } from "./state/outbox.ts";
import { createRedis } from "./state/redis.ts";
import { ReconcileStore } from "./state/reconcile.ts";
import { ScanStore } from "./state/scan.ts";
import { CircuitBreaker } from "./yok/breaker.ts";
import { redisGate } from "./yok/gate.ts";
import { RateLimiter } from "./yok/limiter.ts";
import { openSession } from "./yok/session.ts";

const config = loadConfig();
const redis = createRedis(config.REDIS_URL);
const keys = makeKeys(config.CRAWLER_REDIS_PREFIX);
const queue = new Queue(redis, keys);
const scan = new ScanStore(redis, keys);
const outbox = new Outbox(redis, keys, "meili");
// Only created when the target exists: an outbox nobody drains grows without bound.
const clickhouseOutbox = config.CLICKHOUSE_URL
  ? new Outbox(redis, keys, "clickhouse")
  : undefined;
const reconcile = new ReconcileStore(redis, keys);
const breaker = new CircuitBreaker(redis, keys, {
  failureThreshold: config.CRAWLER_BREAKER_THRESHOLD,
  cooldownMs: config.CRAWLER_BREAKER_COOLDOWN_MS,
});

const controller = new AbortController();
let server: ReturnType<typeof createApi> | undefined;

async function shutdown(signal: string): Promise<void> {
  console.error(`[crawler] ${signal} — shutting down`);
  controller.abort();
  server?.close();
  // In-flight jobs keep their lease; if we die before completing them the reaper
  // requeues them, so there is nothing to flush here.
  await redis.quit().catch(() => {});
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

console.error(`[crawler] role=${config.CRAWLER_ROLE} prefix=${keys.prefix}`);

const role = config.CRAWLER_ROLE;
const wants = {
  api: role === "all" || role === "api",
  scheduler: role === "all" || role === "scheduler",
  worker: role === "all" || role === "worker",
};

if (wants.api) {
  server = createApi({ redis, queue, scan, outbox, breaker, reconcile });
  server.listen(config.PORT, () => console.error(`[crawler] api on :${config.PORT}`));
}

const running: Promise<void>[] = [];

if (wants.scheduler) {
  running.push(
    runScheduler(
      { redis, keys, queue, scan },
      {
        signal: controller.signal,
        policy: { ...DEFAULT_POLICY, maxThesisId: config.CRAWLER_MAX_THESIS_ID },
        onTick: (r) => console.error(`[scheduler] ${JSON.stringify(r)}`),
      },
    ),
  );
}

if (wants.worker) {
  const limiter = new RateLimiter(redis, keys, {
    ratePerSecond: config.CRAWLER_RATE_PER_SECOND,
    capacity: config.CRAWLER_BURST,
  });
  const session = await openSession({ gate: redisGate(limiter, breaker) });
  const lookups = await buildLookups(session);
  const meili = config.MEILI_HOST
    ? createMeiliClient({ host: config.MEILI_HOST, apiKey: config.MEILI_KEY })
    : undefined;
  const clickhouse = config.CLICKHOUSE_URL
    ? createClickhouseClient({
        url: config.CLICKHOUSE_URL,
        username: config.CLICKHOUSE_USERNAME,
        password: config.CLICKHOUSE_PASSWORD,
        database: config.CLICKHOUSE_DATABASE,
      })
    : undefined;
  if (!meili) console.error("[crawler] MEILI_HOST unset — crawling into the outbox only");
  if (!clickhouse) console.error("[crawler] CLICKHOUSE_URL unset — stats projection disabled");

  // Counting held records is the projection's job; ClickHouse is the stats store, so it
  // answers when present and Meili stands in when it is not.
  const countHeldForYear = clickhouse
    ? async (year: number) => {
        const res = await clickhouse.query({
          query: "SELECT count() AS c FROM theses FINAL WHERE year = {year:UInt32}",
          query_params: { year },
          format: "JSONEachRow",
        });
        const rows = await res.json<{ c: string }>();
        return Number(rows[0]?.c ?? 0);
      }
    : meili
      ? async (year: number) => {
          const res = await meili.index("theses").search("", {
            filter: `year = ${year}`, limit: 0, hitsPerPage: 0,
          });
          return Number((res as { totalHits?: number }).totalHits ?? 0);
        }
      : undefined;

  running.push(
    runWorker(
      {
        session, queue, scan, lookups, outbox, clickhouseOutbox, meili, clickhouse,
        reconcile, countHeldForYear,
      },
      queue,
      {
        signal: controller.signal,
        onEvent: ({ job, outcome, detail }) =>
          console.error(`[worker] ${job.kind} -> ${outcome} ${JSON.stringify(detail)}`),
      },
    ),
  );
}

await Promise.all(running);
