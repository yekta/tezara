import "server-only";
import { createClient } from "@clickhouse/client";
import { env } from "@/lib/env";

export const clickhouse = createClient({
  url: env.CLICKHOUSE_URL,
  username: env.CLICKHOUSE_USERNAME,
  password: env.CLICKHOUSE_PASSWORD,
});
