import type { ClickHouseClient } from "./client.ts";
import { MIGRATIONS } from "./schema.ts";

/**
 * Apply pending migrations, tracked in `schema_migrations`.
 *
 * Every statement is CREATE TABLE IF NOT EXISTS, so this is safe to run on every deploy
 * and never touches data. The ledger exists so a future destructive migration can be
 * added without re-running it.
 */
export async function migrate(client: ClickHouseClient): Promise<string[]> {
  // The ledger has to exist before we can read it.
  const ledger = MIGRATIONS.find((m) => m.id === "0011_migrations_log")!;
  await client.command({ query: ledger.sql });

  const applied = new Set<string>();
  const res = await client.query({ query: "SELECT id FROM schema_migrations", format: "JSONEachRow" });
  for (const row of await res.json<{ id: string }>()) applied.add(row.id);

  const ran: string[] = [];
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    await client.command({ query: migration.sql });
    await client.insert({
      table: "schema_migrations",
      values: [{ id: migration.id }],
      format: "JSONEachRow",
    });
    ran.push(migration.id);
  }
  return ran;
}

export async function appliedMigrations(client: ClickHouseClient): Promise<string[]> {
  const res = await client.query({
    query: "SELECT id FROM schema_migrations ORDER BY id",
    format: "JSONEachRow",
  });
  return (await res.json<{ id: string }>()).map((r) => r.id);
}
