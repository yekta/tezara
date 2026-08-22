import { z } from "zod";

/**
 * A URL that must actually parse, with a readable message when it does not.
 * Railway reference variables silently resolve to "" when the referenced variable does
 * not exist on the source service, which is why empty is treated as absent below.
 */
const required = (what: string) =>
  z.string({ error: (issue) => (issue.input === undefined ? `${what} is required` : undefined) });

const url = (what: string) =>
  required(what).refine(
    (v) => {
      try {
        new URL(v);
        return true;
      } catch {
        return false;
      }
    },
    { message: "must be a full URL including scheme and port, e.g. http://host.railway.internal:7700" },
  );

const Env = z.object({
  // --- required: connections and credentials. No defaults. A missing value here is a
  // deployment mistake, and guessing at it only turns a clear failure into a confusing
  // one (a silent localhost connection, or an empty password rejected by the server).
  REDIS_URL: url("REDIS_URL"),
  MEILI_URL_INTERNAL: url("MEILI_URL_INTERNAL"),
  MEILI_ADMIN_KEY: required("MEILI_ADMIN_KEY").min(1),
  CLICKHOUSE_URL: url("CLICKHOUSE_URL"),
  CLICKHOUSE_USERNAME: required("CLICKHOUSE_USERNAME").min(1),
  CLICKHOUSE_PASSWORD: required("CLICKHOUSE_PASSWORD").min(1),

  // --- optional: tuning, with defaults that are genuinely fine to leave alone.
  CLICKHOUSE_DATABASE: z.string().min(1).default("default"),
  CRAWLER_REDIS_PREFIX: z.string().min(1).default("tezara:crawler"),
  /** Sustained request rate against YÖK, shared across the whole deployment. */
  CRAWLER_RATE_PER_SECOND: z.coerce.number().positive().default(2),
  CRAWLER_BURST: z.coerce.number().positive().default(5),
  CRAWLER_BREAKER_THRESHOLD: z.coerce.number().positive().default(5),
  CRAWLER_BREAKER_COOLDOWN_MS: z.coerce.number().positive().default(300_000),
  /** Upper bound of the id space. Measured max Tez No was 1,020,391 in Aug 2026. */
  CRAWLER_MAX_THESIS_ID: z.coerce.number().positive().default(1_030_000),
  PORT: z.coerce.number().positive().default(3000),
});

export type Config = z.infer<typeof Env>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  // Treat "" as absent so a missing Railway reference fails as "required" rather than
  // as a confusing parse error, matching the web app's `emptyStringAsUndefined`.
  const cleaned = Object.fromEntries(
    Object.entries(env).filter(([, v]) => v !== undefined && v !== ""),
  );

  const parsed = Env.safeParse(cleaned);
  if (!parsed.success) {
    console.error("invalid crawler configuration:");
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  const config = parsed.data;

  console.error(
    `[crawler] config redis=${redact(config.REDIS_URL)}` +
      ` meili=${config.MEILI_URL_INTERNAL}` +
      ` clickhouse=${config.CLICKHOUSE_URL}/${config.CLICKHOUSE_DATABASE}` +
      ` rate=${config.CRAWLER_RATE_PER_SECOND}/s`,
  );

  return config;
}

/** Strip credentials so a URL can be logged. */
function redact(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.password) u.password = "***";
    if (u.username) u.username = "***";
    return u.toString();
  } catch {
    return raw;
  }
}
