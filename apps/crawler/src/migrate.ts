/**
 * Apply Meili index settings, then verify them.
 *   MEILI_URL_INTERNAL=… MEILI_ADMIN_KEY=… pnpm --filter @tezara/crawler migrate
 *
 * Must run before the first sync: addDocuments silently auto-creates indexes with
 * Meili's defaults, which leaves every filter the web app relies on returning nothing.
 */
import { createClickhouseClient, migrate as migrateClickhouse } from "@tezara/clickhouse";
import { applySettings, createMeiliClient, verifySettings } from "@tezara/meili";

const host = process.env.MEILI_URL_INTERNAL;
const chUrl = process.env.CLICKHOUSE_URL;
if (!host && !chUrl) {
  console.error("set MEILI_URL_INTERNAL and/or CLICKHOUSE_URL");
  process.exit(1);
}

if (host) {
  const client = createMeiliClient({ host, apiKey: process.env.MEILI_ADMIN_KEY ?? "" });
  const applied = await applySettings(client, { waitForTasks: true });
  console.error(`meili: applied settings to ${applied.length} indexes`);

  const drift = await verifySettings(client);
  if (drift.length > 0) {
    console.error("meili: settings drift remains after migration:");
    for (const d of drift) console.error(`  ${d.index}: ${JSON.stringify(d)}`);
    process.exit(1);
  }
  console.error("meili: verified against the declarative definitions");
}

if (chUrl) {
  const ch = createClickhouseClient({
    url: chUrl,
    database: process.env.CLICKHOUSE_DATABASE ?? "default",
  });
  const ran = await migrateClickhouse(ch);
  console.error(`clickhouse: applied ${ran.length} migration(s)${ran.length ? `: ${ran.join(", ")}` : ""}`);
  await ch.close();
}
