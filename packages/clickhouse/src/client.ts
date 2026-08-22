import { createClient, type ClickHouseClient } from "@clickhouse/client";

/**
 * Everything lives in the URL — `http://user:pass@host:8123/database` — so a deployment
 * is one variable rather than several that can drift apart.
 */
export function createClickhouseClient(opts: { url: string }): ClickHouseClient {
  return createClient({ url: opts.url });
}

export type { ClickHouseClient };
