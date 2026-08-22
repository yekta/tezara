/**
 * Fails the build BEFORE `next build` starts if the datastores it prerenders against are
 * missing or unreachable.
 *
 * `generateStaticParams`, `generateMetadata`, the page renders and the opengraph images all
 * query ClickHouse and Meilisearch during page-data collection. Those call sites wrap every
 * query in `try/catch`, so an unreachable datastore does not fail the build — it silently
 * renders thousands of `notFound()` pages, or stalls until Next's 60s per-page prerender
 * timeout fires. Both look like a slow build rather than a broken one.
 *
 * So: check reachability up front, and die with the URL that failed.
 */

const TIMEOUT_MS = 10_000;

function redact(raw) {
  try {
    const u = new URL(raw);
    if (u.password) u.password = "***";
    if (u.username) u.username = "***";
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}

function required(name, hint) {
  const value = process.env[name];
  if (!value) {
    fail(`${name} is not set.\n  ${hint}`);
  }
  return value;
}

function fail(message) {
  console.error(`\n✗ build preflight failed\n\n  ${message}\n`);
  process.exit(1);
}

/**
 * `fetch` refuses a URL carrying inline credentials, and the ClickHouse URL carries them
 * (http://user:pass@host:8123). Move them to an Authorization header instead of failing.
 */
function splitCredentials(raw) {
  const u = new URL(raw);
  if (!u.username && !u.password) return { url: raw, headers: {} };
  const basic = Buffer.from(
    `${decodeURIComponent(u.username)}:${decodeURIComponent(u.password)}`
  ).toString("base64");
  u.username = "";
  u.password = "";
  return { url: u.toString(), headers: { Authorization: `Basic ${basic}` } };
}

/**
 * `@clickhouse/client` takes the database as the URL path (http://host:8123/default), but
 * the ClickHouse HTTP interface itself wants `?database=` and 404s on the path. Probe the
 * origin and move the database to a query param, so a perfectly good URL is not reported
 * as unreachable.
 */
function splitDatabase(raw) {
  const u = new URL(raw);
  const database = u.pathname.replace(/^\/+|\/+$/g, "");
  u.pathname = "/";
  return { url: u.toString(), database: database || null };
}

async function probe(label, rawUrl, path, init = {}, reportAs = rawUrl) {
  let url, credentialHeaders;
  try {
    ({ url, headers: credentialHeaders } = splitCredentials(rawUrl));
  } catch {
    fail(`${label} URL is not a valid URL: ${redact(reportAs)}`);
  }
  const target = new URL(path, url.endsWith("/") ? url : `${url}/`);
  let res;
  try {
    res = await fetch(target, {
      ...init,
      headers: { ...credentialHeaders, ...init.headers },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    fail(
      `${label} is unreachable at ${redact(reportAs)}\n  ${error.message}\n\n` +
        `  The build queries ${label} directly. On Unbind this must be an address the\n` +
        `  builder can actually resolve — the private service network does not exist yet\n` +
        `  at build time, so a *.unbind.internal host will not work here.`
    );
  }
  if (!res.ok) {
    fail(`${label} answered ${res.status} ${res.statusText} at ${redact(reportAs)}`);
  }
  console.log(`✓ ${label} reachable at ${redact(reportAs)}`);
}

// ClickHouse. Credentials live in the URL: http://user:pass@host:8123/database
const clickhouseUrl = required(
  "CLICKHOUSE_URL_BUILD",
  "Set it to a ClickHouse address the BUILDER can reach, and pass it as a BuildKit secret\n" +
    "  (id=clickhouse_url_build). If the builder runs inside the cluster this can be the same\n" +
    "  private address as CLICKHOUSE_URL; if not, it has to be publicly routable."
);
{
  const { url, database } = splitDatabase(clickhouseUrl);
  // `SELECT 1` rather than /ping: /ping answers before authenticating, so a wrong password
  // would sail past it and only surface as a swallowed error mid-prerender. Naming the
  // database also catches a URL that points at one that does not exist.
  const query = database
    ? `?database=${encodeURIComponent(database)}&query=SELECT%201`
    : "?query=SELECT%201";
  await probe("ClickHouse", url, query, {}, clickhouseUrl);
}

// Meilisearch, as reached by the BUILDER.
const meiliUrl = required(
  "MEILI_URL_BUILD",
  "Set it to a Meilisearch address the builder can reach. If the builder runs inside the\n" +
    "  cluster this is the same private address as MEILI_URL_INTERNAL."
);
const meiliKey = required("MEILI_ADMIN_KEY", "The build reads indexes with the admin key.");
// /keys rather than /health: /health answers without authenticating, so a wrong admin key
// would sail past it and only surface as a swallowed error mid-prerender.
await probe("Meilisearch", meiliUrl, "keys?limit=1", {
  headers: { Authorization: `Bearer ${meiliKey}` },
});

// Not probed: this is the BROWSER's address, so it need not be reachable from inside the
// builder. But Next inlines it into the client bundle at build time, so a missing value
// ships a bundle that cannot search — check it is at least present.
required(
  "NEXT_PUBLIC_MEILI_URL",
  "Next inlines this into the client bundle, so a missing value ships a broken bundle.\n" +
    "  This is the public address browsers use — not MEILI_URL_BUILD."
);
