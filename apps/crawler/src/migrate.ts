/**
 * Apply Meili index settings, then verify them.
 *   MEILI_URL_INTERNAL=… MEILI_ADMIN_KEY=… pnpm --filter @tezara/crawler migrate
 *
 * Not normally needed: the crawler applies settings on boot (see prepareTargets in
 * index.ts), which is what makes a container deploy self-migrating. This stays as the
 * way to migrate without starting a crawler — a fresh Meili, or a targeted re-apply.
 */
import { createClickhouseClient, migrate as migrateClickhouse } from "@tezara/clickhouse";
import { applySettings, createMeiliClient, verifySettings } from "@tezara/meili";
import { error, info } from "./log.ts";

const host = process.env.MEILI_URL_INTERNAL;
const chUrl = process.env.CLICKHOUSE_URL;
if (!host && !chUrl) {
  error("set MEILI_URL_INTERNAL and/or CLICKHOUSE_URL");
  process.exit(1);
}

if (host) {
  const client = createMeiliClient({ host, apiKey: process.env.MEILI_ADMIN_KEY ?? "" });
  const applied = await applySettings(client, { waitForTasks: true, log: info });
  info(`meili: applied settings to ${applied.length} indexes`);

  const drift = await verifySettings(client);
  if (drift.length > 0) {
    error("meili: settings drift remains after migration:");
    for (const d of drift) error(`  ${d.index}: ${JSON.stringify(d)}`);
    process.exit(1);
  }
  info("meili: verified against the declarative definitions");
}

if (chUrl) {
  const ch = createClickhouseClient({ url: chUrl });
  const ran = await migrateClickhouse(ch);
  info(`clickhouse: applied ${ran.length} migration(s)${ran.length ? `: ${ran.join(", ")}` : ""}`);
  await ch.close();
}
