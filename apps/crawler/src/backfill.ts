/**
 * Enqueue and run a slice of the id-space backfill, then drain the outbox into Meili.
 *   pnpm --filter @tezara/crawler backfill 200 260 [--chunk 20]
 *
 * Resumable: re-running the same range skips ids already in the scan store, so an
 * interrupted run costs only the ids it had not reached. Set MEILI_HOST + MEILI_KEY to
 * also project the results; without them the crawl still runs and the outbox just grows.
 */
import { createMeiliClient } from "@tezara/meili";
import { buildLookups } from "./jobs/context.ts";
import { syncMeili } from "./jobs/sync-meili.ts";
import { Outbox } from "./state/outbox.ts";
import { Queue } from "./queue/queue.ts";
import { runWorker } from "./roles/worker.ts";
import { DEFAULT_PREFIX, makeKeys } from "./state/keys.ts";
import { createRedis } from "./state/redis.ts";
import { ScanStore } from "./state/scan.ts";
import { openSession } from "./yok/session.ts";

const args = process.argv.slice(2);
const from = Number(args[0]);
const to = Number(args[1]);
const chunkArg = args.indexOf("--chunk");
const chunk = chunkArg === -1 ? 25 : Number(args[chunkArg + 1]);

if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
  console.error("usage: backfill <from> <to> [--chunk n]");
  process.exit(1);
}

const redis = createRedis();
const keys = makeKeys(process.env.CRAWLER_REDIS_PREFIX ?? DEFAULT_PREFIX);
const queue = new Queue(redis, keys);
const scan = new ScanStore(redis, keys);
const outbox = new Outbox(redis, keys);
const meiliHost = process.env.MEILI_HOST;
const meili = meiliHost
  ? createMeiliClient({ host: meiliHost, apiKey: process.env.MEILI_KEY ?? "" })
  : undefined;
const session = await openSession({ delayMs: Number(process.env.CRAWLER_DELAY_MS ?? 400) });

const controller = new AbortController();
process.on("SIGINT", () => {
  console.error("\ninterrupted — finishing current id then stopping");
  controller.abort();
});

try {
  const lookups = await buildLookups(session);
  for (let start = from; start <= to; start += chunk) {
    await queue.enqueue("scan-id-range", { from: start, to: Math.min(start + chunk - 1, to) });
  }
  console.error(`queued ${Math.ceil((to - from + 1) / chunk)} range job(s) over ${from}..${to}`);

  await runWorker(
    { session, queue, scan, lookups, outbox, meili },
    queue,
    {
      signal: controller.signal,
      exitWhenDrained: true,
      onEvent: ({ job, outcome, detail }) => {
        const p = job.params as { from: number; to: number };
        console.error(`  ${job.kind} ${p.from}..${p.to} -> ${outcome} ${JSON.stringify(detail)}`);
      },
    },
  );

  if (meili) {
    const synced = await syncMeili({ client: meili, outbox });
    console.error(`\nsynced to Meili: ${JSON.stringify(synced)}`);
  }

  const stats = await queue.stats();
  const counts = await scan.counts();
  console.error(`\noutbox depth: ${await outbox.depth()}`);
  console.error(`queue: ${JSON.stringify(stats)}`);
  console.error(`scan store: ${counts.tracked} ids tracked`);
  console.error(`watermark: ${await scan.watermark("head")}`);
} finally {
  await session.close();
  await redis.quit();
}
