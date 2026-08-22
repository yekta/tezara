import "server-only";
import { createClient } from "@clickhouse/client";
import { env } from "@/lib/env";
import { isBuildPhase } from "@/server/build-phase";

/**
 * Server-side ClickHouse client.
 *
 * The build prerenders against ClickHouse, but the private service network does not exist
 * during `next build` — so the build needs `CLICKHOUSE_URL_BUILD`, a publicly routable
 * address. It is required, not optional: falling back to the runtime URL would point the
 * build at a host it cannot resolve, and because every query site wraps its call in
 * `try/catch` that failure would be swallowed into thousands of `notFound()` pages instead
 * of a failed build. `scripts/preflight-build.mjs` checks it is actually reachable before
 * `next build` starts.
 */
function buildPhaseUrl() {
  const url = env.CLICKHOUSE_URL_BUILD;
  if (!url) {
    throw new Error(
      "CLICKHOUSE_URL_BUILD is required during `next build`. Set it to a publicly routable " +
        "ClickHouse address; CLICKHOUSE_URL is the runtime private-network address and is " +
        "not reachable from the builder."
    );
  }
  return url;
}

export const clickhouse = createClient({
  // Credentials live in the URL: http://user:pass@host:8123
  url: isBuildPhase ? buildPhaseUrl() : env.CLICKHOUSE_URL,
});
