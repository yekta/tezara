/**
 * One-time import of the legacy Redis crawl state into ClickHouse.
 *   pnpm --filter @tezara/crawler import-redis-state
 *
 * The pre-2026-08 crawler kept per-id scan state in Redis hashes (`<prefix>:scan:<id>`),
 * the due schedule in a ZSET (`<prefix>:scan:due`) and watermarks as strings
 * (`<prefix>:watermark:<name>`). Without this import a new deployment starts from an
 * empty crawl_state and re-crawls the entire id space — correct, but ~2 days of
 * traffic and a full re-index for nothing.
 *
 * Idempotent: crawl_state is a ReplacingMergeTree, so re-running replaces rows. The
 * legacy keys are left untouched — delete them once the new crawler looks healthy.
 * Drain the old outboxes (or accept that reconcile-projections re-crawls their
 * contents) before switching over; outbox lists are deliberately not imported.
 */
import { createClickhouseClient, migrate as migrateClickhouse } from "@tezara/clickhouse";
import { loadConfig } from "./config.ts";
import { info } from "./log.ts";
import { RECHECK_MS, type ScanState } from "./state/ch-scan.ts";
import { makeKeys } from "./state/keys.ts";
import { createRedis } from "./state/redis.ts";

const config = loadConfig();
const redis = createRedis(config.REDIS_URL);
const keys = makeKeys(config.CRAWLER_REDIS_PREFIX);
const clickhouse = createClickhouseClient({ url: config.CLICKHOUSE_URL });

const BATCH = 5_000;

try {
  await migrateClickhouse(clickhouse);

  // The due ZSET holds the next-check schedule; read it whole (1M zscores one by one
  // would take an hour).
  const due = new Map<number, number>();
  const dueRaw = await redis.zrange(`${keys.prefix}:scan:due`, 0, -1, "WITHSCORES");
  for (let i = 0; i < dueRaw.length; i += 2) {
    due.set(Number(dueRaw[i]), Number(dueRaw[i + 1]));
  }
  info(`legacy due schedule: ${due.size} ids`);

  let imported = 0;
  let cursor = "0";
  let batch: Record<string, unknown>[] = [];

  const flush = async () => {
    if (batch.length === 0) return;
    await clickhouse.insert({ table: "crawl_state", values: batch, format: "JSONEachRow" });
    imported += batch.length;
    batch = [];
    info(`  imported ${imported} ids…`);
  };

  do {
    const [next, found] = await redis.scan(
      cursor, "MATCH", `${keys.prefix}:scan:*`, "COUNT", 2_000,
    );
    cursor = next;

    const ids = found
      .map((k) => Number(k.slice(`${keys.prefix}:scan:`.length)))
      .filter((id) => Number.isInteger(id) && id > 0); // skips scan:due itself

    if (ids.length === 0) continue;
    const pipeline = redis.pipeline();
    for (const id of ids) pipeline.hgetall(`${keys.prefix}:scan:${id}`);
    const results = (await pipeline.exec()) ?? [];

    results.forEach(([err, hash], i) => {
      const h = hash as Record<string, string> | null;
      if (err || !h || !h.state) return;
      const id = ids[i]!;
      const state = h.state as ScanState;
      const lastChecked = Number(h.lastChecked) || Date.now();
      const attempts = Number(h.attempts ?? 0);
      batch.push({
        id,
        state,
        last_checked: lastChecked,
        next_check_at: due.get(id) ?? lastChecked + RECHECK_MS[state](attempts),
        attempts,
        content_hash: h.contentHash ?? "",
      });
    });
    if (batch.length >= BATCH) await flush();
  } while (cursor !== "0");
  await flush();

  const marks: Record<string, unknown>[] = [];
  for (const name of ["head", "backfill"]) {
    const value = await redis.get(`${keys.prefix}:watermark:${name}`);
    if (value !== null) marks.push({ name, value: Number(value) });
  }
  if (marks.length > 0) {
    await clickhouse.insert({ table: "crawl_watermarks", values: marks, format: "JSONEachRow" });
  }

  info(`done: ${imported} scan records and ${marks.length} watermark(s) imported`);
  info("legacy Redis keys were left in place — remove them once the new crawler is healthy");
} finally {
  await redis.quit().catch(() => {});
  await clickhouse.close().catch(() => {});
}
