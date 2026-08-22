/**
 * Apply Meili index settings, then verify them.
 *   MEILI_HOST=… MEILI_KEY=… pnpm --filter @tezara/crawler migrate
 *
 * Must run before the first sync: addDocuments silently auto-creates indexes with
 * Meili's defaults, which leaves every filter the web app relies on returning nothing.
 */
import { applySettings, createMeiliClient, verifySettings } from "@tezara/meili";

const host = process.env.MEILI_HOST;
const apiKey = process.env.MEILI_KEY ?? "";
if (!host) {
  console.error("MEILI_HOST is required");
  process.exit(1);
}

const client = createMeiliClient({ host, apiKey });
const applied = await applySettings(client, { waitForTasks: true });
console.error(`applied settings to ${applied.length} indexes`);

const drift = await verifySettings(client);
if (drift.length > 0) {
  console.error("settings drift remains after migration:");
  for (const d of drift) console.error(`  ${d.index}: ${JSON.stringify(d)}`);
  process.exit(1);
}
console.error("verified: all indexes match the declarative definitions");
