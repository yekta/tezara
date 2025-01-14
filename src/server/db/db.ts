import "server-only";

import { drizzle, NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import { PgTransaction } from "drizzle-orm/pg-core";
import { ExtractTablesWithRelations } from "drizzle-orm";

const databaseUrlRaw = env.DATABASE_URL;
if (!databaseUrlRaw) {
  throw new Error("DATABASE_URL is not set");
}
const databaseUrl = databaseUrlRaw;

const pool = new Pool({
  connectionString: databaseUrl,
  idleTimeoutMillis: 5 * 60 * 1000,
});
export const db = drizzle({ client: pool });

export type TDbTransaction = PgTransaction<
  NodePgQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;
