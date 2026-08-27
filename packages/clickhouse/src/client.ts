import { createClient, type ClickHouseClient } from "@clickhouse/client";

/**
 * Everything lives in the URL — `http://user:pass@host:8123/database` — so a deployment
 * is one variable rather than several that can drift apart.
 *
 * `request_timeout`: the aggregate rebuild's INSERT … SELECT is deliberately slow
 * (single-threaded, spills to disk) and sends no response bytes until it completes, so
 * the client's default 30s timeout would tear down the socket mid-query — the server
 * finishes the work anyway, but the caller sees a failure and retries it forever.
 */
export function createClickhouseClient(opts: { url: string }): ClickHouseClient {
  return createClient({ url: opts.url, request_timeout: 1_200_000 });
}

export type { ClickHouseClient };
