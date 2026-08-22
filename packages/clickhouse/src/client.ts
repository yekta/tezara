import { createClient, type ClickHouseClient } from "@clickhouse/client";

export function createClickhouseClient(opts: {
  url: string;
  username?: string;
  password?: string;
  database?: string;
}): ClickHouseClient {
  return createClient({
    url: opts.url,
    username: opts.username ?? "default",
    password: opts.password ?? "",
    database: opts.database ?? "default",
  });
}

export type { ClickHouseClient };
