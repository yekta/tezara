import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";

/**
 * Load .env.local then .env, without clobbering anything already in the environment.
 *
 * Precedence is real env > .env.local > .env, matching Next's convention, so a value
 * exported in the shell (or injected by Railway) always wins over a file. Files are
 * looked for in the working directory and in the repo root, so it works whether you run
 * from apps/crawler or from the workspace root.
 */
function loadEnvFiles(): void {
  const roots = [process.cwd(), resolve(dirname(new URL(import.meta.url).pathname), "../../..")];
  const seen = new Set<string>();

  for (const root of roots) {
    for (const name of [".env.local", ".env"]) {
      const path = resolve(root, name);
      if (seen.has(path) || !existsSync(path)) continue;
      seen.add(path);

      for (const line of readFileSync(path, "utf8").split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;

        const key = trimmed.slice(0, eq).trim().replace(/^export\s+/, "");
        if (key in process.env) continue; // never override

        let value = trimmed.slice(eq + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  }
}

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
  /** Credentials go in the URL: http://user:pass@clickhouse.railway.internal:8123 */
  CLICKHOUSE_URL: url("CLICKHOUSE_URL"),

  // --- optional: tuning, with defaults that are genuinely fine to leave alone.
  CLICKHOUSE_DATABASE: z.string().min(1).default("default"),
  CRAWLER_REDIS_PREFIX: z.string().min(1).default("tezara:crawler"),
  /** Jobs run in parallel. The shared rate limit still caps total request volume. */
  CRAWLER_CONCURRENCY: z.coerce.number().positive().default(10),
  CRAWLER_BREAKER_THRESHOLD: z.coerce.number().positive().default(5),
  CRAWLER_BREAKER_COOLDOWN_MS: z.coerce.number().positive().default(300_000),
  /** Upper bound of the id space. Measured max Tez No was 1,020,391 in Aug 2026. */
  CRAWLER_MAX_THESIS_ID: z.coerce.number().positive().default(1_030_000),
  PORT: z.coerce.number().positive().default(3000),
});

export type Config = z.infer<typeof Env>;

export function loadConfig(env?: NodeJS.ProcessEnv): Config {
  if (!env) {
    loadEnvFiles();
    env = process.env;
  }
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
      ` clickhouse=${redact(config.CLICKHOUSE_URL)}/${config.CLICKHOUSE_DATABASE}` +
      ` concurrency=${config.CRAWLER_CONCURRENCY}`,
  );

  return config;
}

/** Strip credentials so a URL can be logged. */
function redact(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.password) u.password = "***";
    if (u.username) u.username = "***";
    // toString() appends a trailing slash for a bare origin, which reads badly when a
    // database name is concatenated after it.
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}
