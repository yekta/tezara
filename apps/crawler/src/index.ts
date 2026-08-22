/**
 * One image, three roles selected by CRAWLER_ROLE.
 *   scheduler — exactly one instance, enqueues due work
 *   worker    — scale freely, claims and runs jobs
 *   api       — /health /ready /metrics
 */
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
const outbox = new Outbox(redis, keys);
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

switch (config.CRAWLER_ROLE) {
  case "api": {
    server = createApi({ redis, queue, scan, outbox, breaker });
    server.listen(config.PORT, () => console.error(`[crawler] api on :${config.PORT}`));
    break;
  }

  case "scheduler": {
    await runScheduler(
      { redis, keys, queue, scan },
      {
        signal: controller.signal,
        policy: { ...DEFAULT_POLICY, maxThesisId: config.CRAWLER_MAX_THESIS_ID },
        onTick: (r) => console.error(`[scheduler] ${JSON.stringify(r)}`),
      },
    );
    break;
  }

  case "worker": {
    const limiter = new RateLimiter(redis, keys, {
      ratePerSecond: config.CRAWLER_RATE_PER_SECOND,
      capacity: config.CRAWLER_BURST,
    });
    const session = await openSession({ gate: redisGate(limiter, breaker) });
    const lookups = await buildLookups(session);
    const meili = config.MEILI_HOST
      ? createMeiliClient({ host: config.MEILI_HOST, apiKey: config.MEILI_KEY })
      : undefined;
    if (!meili) console.error("[crawler] MEILI_HOST unset — crawling into the outbox only");

    await runWorker({ session, queue, scan, lookups, outbox, meili }, queue, {
      signal: controller.signal,
      onEvent: ({ job, outcome, detail }) =>
        console.error(`[worker] ${job.kind} -> ${outcome} ${JSON.stringify(detail)}`),
    });
    break;
  }
}
