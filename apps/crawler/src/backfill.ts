/**
 * Crawl a slice of the id space, then drain the outbox into Meili.
 *   pnpm --filter @tezara/crawler backfill 200 260 [--chunk 20]
 *
 * Resumable: re-running the same range skips ids already in the scan store, so an
 * interrupted run costs only the ids it had not reached. Set MEILI_URL_INTERNAL +
 * MEILI_ADMIN_KEY to also project the results; without them the crawl still runs and
 * the outbox just holds the work. CLICKHOUSE_URL is required — crawl state lives there.
 */
import { createClickhouseClient, migrate as migrateClickhouse } from "@tezara/clickhouse";
import { createMeiliClient } from "@tezara/meili";
import { buildLookups } from "./jobs/context.ts";
import { scanRange } from "./jobs/crawl.ts";
import { syncMeili } from "./jobs/sync-meili.ts";
import { DimensionCache } from "./state/dimensions.ts";
import { Outbox } from "./state/outbox.ts";
import { DEFAULT_PREFIX, makeKeys } from "./state/keys.ts";
import { createRedis } from "./state/redis.ts";
import { ChScanStore } from "./state/ch-scan.ts";
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

const chUrl = process.env.CLICKHOUSE_URL;
if (!chUrl) {
  console.error("CLICKHOUSE_URL is required — the scan store lives there");
  process.exit(1);
}

const redis = createRedis();
const keys = makeKeys(process.env.CRAWLER_REDIS_PREFIX ?? DEFAULT_PREFIX);
const clickhouse = createClickhouseClient({ url: chUrl });
const scan = new ChScanStore(clickhouse);
const outbox = new Outbox(redis, keys);
const dimensions = new DimensionCache(redis, keys);
const meiliUrl = process.env.MEILI_URL_INTERNAL;
const meili = meiliUrl
  ? createMeiliClient({ host: meiliUrl, apiKey: process.env.MEILI_ADMIN_KEY ?? "" })
  : undefined;
const session = await openSession({ delayMs: Number(process.env.CRAWLER_DELAY_MS ?? 400) });

const controller = new AbortController();
process.on("SIGINT", () => {
  console.error("\ninterrupted — finishing current id then stopping");
  controller.abort();
});

try {
  await migrateClickhouse(clickhouse);
  const lookups = await buildLookups(session);
  const ctx = { session, scan, lookups, outbox, dimensions, meili, clickhouse };

  for (let start = from; start <= to && !controller.signal.aborted; start += chunk) {
    const end = Math.min(start + chunk - 1, to);
    const counts = await scanRange(ctx, { from: start, to: end }, controller.signal);
    await scan.flush();
    console.error(`  ${start}..${end} -> ${JSON.stringify(counts)}`);
  }

  if (meili) {
    const synced = await syncMeili({ client: meili, outbox, known: dimensions });
    console.error(`\nsynced to Meili: ${JSON.stringify(synced)}`);
  }

  const counts = await scan.counts();
  console.error(`\noutbox depth: meili ${await outbox.depth("meili")}, clickhouse ${await outbox.depth("clickhouse")}`);
  console.error(`scan store: ${counts.tracked} ids tracked`);
  console.error(`watermark: ${await scan.watermark("head")}`);
} finally {
  await session.close();
  await redis.quit();
  await clickhouse.close().catch(() => {});
}
