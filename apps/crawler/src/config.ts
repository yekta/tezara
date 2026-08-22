import { z } from "zod";

const Env = z.object({
  // "all" runs scheduler + worker + api in one process, which is the right shape for
  // this workload: ~1M theses growing by ~100k a year. Splitting roles only matters if
  // you need to scale workers independently, which this does not.
  CRAWLER_ROLE: z.enum(["all", "scheduler", "worker", "api"]).default("all"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  CRAWLER_REDIS_PREFIX: z.string().default("tezara:crawler"),
  /** Sustained request rate against YÖK, shared across every worker. */
  CRAWLER_RATE_PER_SECOND: z.coerce.number().positive().default(2),
  CRAWLER_BURST: z.coerce.number().positive().default(5),
  CRAWLER_BREAKER_THRESHOLD: z.coerce.number().positive().default(5),
  CRAWLER_BREAKER_COOLDOWN_MS: z.coerce.number().positive().default(300_000),
  CRAWLER_MAX_THESIS_ID: z.coerce.number().positive().default(1_030_000),
  PORT: z.coerce.number().positive().default(3000),
  MEILI_URL_INTERNAL: z.string().optional(),
  MEILI_ADMIN_KEY: z.string().default(""),
  CLICKHOUSE_URL: z.string().optional(),
  CLICKHOUSE_USERNAME: z.string().default("default"),
  CLICKHOUSE_PASSWORD: z.string().default(""),
  CLICKHOUSE_DATABASE: z.string().default("default"),
});

export type Config = z.infer<typeof Env>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = Env.safeParse(env);
  if (!parsed.success) {
    console.error("invalid crawler configuration:");
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  return parsed.data;
}
