import "server-only";
import { createClient } from "@clickhouse/client";
import { env } from "@/lib/env";
import { isBuildPhase } from "@/server/build-phase";

/**
 * Server-side ClickHouse client.
 *
 * `CLICKHOUSE_URL_BUILD` exists because the private network is unavailable during
 * `next build`; set it to a publicly routable ClickHouse address. If it is unset the
 * build falls back to the runtime URL, which only works where the builder shares a
 * network with ClickHouse.
 */
export const clickhouse = createClient({
  // Credentials live in the URL: http://user:pass@host:8123
  url: isBuildPhase ? (env.CLICKHOUSE_URL_BUILD ?? env.CLICKHOUSE_URL) : env.CLICKHOUSE_URL,
});
