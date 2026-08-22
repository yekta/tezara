import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";

/**
 * Precedence is real env > .env.local > .env, so a value injected by the platform always
 * wins over a file. Both the working directory and the repo root are checked.
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
        if (key in process.env) continue;

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
    { message: "must be a full URL including scheme and port" },
  );

const Env = z.object({
  REDIS_URL: url("REDIS_URL"),
  MEILI_URL_INTERNAL: url("MEILI_URL_INTERNAL"),
  MEILI_ADMIN_KEY: required("MEILI_ADMIN_KEY").min(1),
  /** Credentials and database in the URL: http://user:pass@host:8123/tezara */
  CLICKHOUSE_URL: url("CLICKHOUSE_URL"),

  CRAWLER_REDIS_PREFIX: z.string().min(1).default("tezara:crawler"),
  CRAWLER_CONCURRENCY: z.coerce.number().positive().default(10),
  CRAWLER_BREAKER_THRESHOLD: z.coerce.number().positive().default(5),
  CRAWLER_BREAKER_COOLDOWN_MS: z.coerce.number().positive().default(300_000),
  /** Measured max Tez No was 1,020,391 in Aug 2026. */
  CRAWLER_MAX_THESIS_ID: z.coerce.number().positive().default(1_030_000),
  PORT: z.coerce.number().positive().default(3000),
});

export type Config = z.infer<typeof Env>;

export function loadConfig(env?: NodeJS.ProcessEnv): Config {
  if (!env) {
    loadEnvFiles();
    env = process.env;
  }
  // Platform reference variables resolve to "" when the source variable does not exist,
  // so treat empty as absent — otherwise a missing value fails as a parse error rather
  // than as "required".
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
      ` clickhouse=${redact(config.CLICKHOUSE_URL)}` +
      ` concurrency=${config.CRAWLER_CONCURRENCY}`,
  );

  return config;
}

function redact(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.password) u.password = "***";
    if (u.username) u.username = "***";
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}
