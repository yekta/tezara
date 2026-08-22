/**
 * Wipe all crawled data and start over.
 *
 *   pnpm --filter @tezara/crawler wipe
 *
 * Wipes Redis crawl state, every Meili index and every ClickHouse table.
 * Deletes documents and rows, not schemas: Meili index settings and ClickHouse tables
 * survive, so the crawler can start again without re-running the migration.
 *
 * Uses the same environment as the crawler itself, so whatever it is pointed at is what
 * gets wiped — check the summary it prints before confirming.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { createClickhouseClient } from "@tezara/clickhouse";
import { createMeiliClient, INDEX_NAMES } from "@tezara/meili";
import { loadConfig } from "./config.ts";
import { makeKeys } from "./state/keys.ts";
import { createRedis } from "./state/redis.ts";

const CONFIRMATION = "I confirm that all data will be wiped";

const CLICKHOUSE_TABLES = [
  "theses", "subjects", "keywords", "advisors",
  "thesis_subjects", "thesis_keywords", "thesis_advisors",
  "universities", "subject_stats", "thesis_subjects_by_university",
];

const config = loadConfig();
const keys = makeKeys(config.CRAWLER_REDIS_PREFIX);
const redis = createRedis(config.REDIS_URL);
const meili = createMeiliClient({
  host: config.MEILI_URL_INTERNAL,
  apiKey: config.MEILI_ADMIN_KEY,
});
const clickhouse = createClickhouseClient({ url: config.CLICKHOUSE_URL });

/** Hide credentials so a connection string can be printed. */
const redact = (url: string) => url.replace(/\/\/[^@]*@/, "//***:***@");

/** Every key the crawler owns, found without blocking Redis the way KEYS would. */
async function scanCrawlerKeys(): Promise<string[]> {
  const found: string[] = [];
  let cursor = "0";
  do {
    const [next, batch] = await redis.scan(cursor, "MATCH", `${keys.prefix}:*`, "COUNT", 1000);
    cursor = next;
    found.push(...batch);
  } while (cursor !== "0");
  return found;
}

async function main(): Promise<void> {
  console.error("This will wipe:\n");

  const redisKeys = await scanCrawlerKeys();
  console.error(`  Redis      ${redisKeys.length} keys under "${keys.prefix}:*"`);
  console.error(`             ${redact(config.REDIS_URL)}`);

  let meiliDocs = 0;
  for (const name of INDEX_NAMES) {
    try {
      meiliDocs += (await meili.index(name).getStats()).numberOfDocuments;
    } catch {
      // absent index — nothing to count
    }
  }
  console.error(`  Meili      ${meiliDocs} documents across ${INDEX_NAMES.length} indexes`);
  console.error(`             ${config.MEILI_URL_INTERNAL}`);

  let chRows = 0;
  try {
    const res = await clickhouse.query({
      query: "SELECT count() AS c FROM theses",
      format: "JSONEachRow",
    });
    chRows = Number((await res.json<{ c: string }>())[0]?.c ?? 0);
  } catch {
    // absent table — nothing to count
  }
  console.error(`  ClickHouse ${chRows} theses across ${CLICKHOUSE_TABLES.length} tables`);
  console.error(`             ${redact(config.CLICKHOUSE_URL)}`);

  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(`\nType "${CONFIRMATION}" to proceed:\n> `);
  rl.close();

  if (answer.trim() !== CONFIRMATION) {
    console.error("\nNot confirmed — nothing was touched.");
    process.exitCode = 1;
    return;
  }

  console.error("");

  // Batch the deletes: one DEL per key is thousands of round trips.
  for (let i = 0; i < redisKeys.length; i += 500) {
    await redis.del(...redisKeys.slice(i, i + 500));
  }
  console.error(`  Redis      deleted ${redisKeys.length} keys`);

  for (const name of INDEX_NAMES) {
    try {
      const task = await meili.index(name).deleteAllDocuments();
      await meili.index(name).waitForTask(task.taskUid);
    } catch {
      // absent index is already empty
    }
  }
  console.error(`  Meili      emptied ${INDEX_NAMES.length} indexes (settings kept)`);

  for (const table of CLICKHOUSE_TABLES) {
    await clickhouse.command({ query: `TRUNCATE TABLE IF EXISTS ${table}` }).catch(() => {});
  }
  console.error(`  ClickHouse truncated ${CLICKHOUSE_TABLES.length} tables (schema kept)`);

  console.error("\nDone. The crawler will start from thesis id 1 on its next run.");
}

try {
  await main();
} finally {
  await redis.quit().catch(() => {});
  await clickhouse.close().catch(() => {});
}
