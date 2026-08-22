import { createClient, type ClickHouseClient } from "@clickhouse/client";

/**
 * Credentials belong in the URL — `http://user:pass@host:8123` — so a deployment is one
 * variable rather than three that can drift apart.
 */
export function createClickhouseClient(opts: {
  url: string;
  database?: string;
}): ClickHouseClient {
  return createClient({ url: opts.url, database: opts.database ?? "default" });
}

export type { ClickHouseClient };
