import "server-only";

import { MeiliSearch } from "meilisearch";
import { env } from "@/lib/env";
import { isBuildPhase } from "@/server/build-phase";

const MEILI_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Server-side Meilisearch client.
 *
 * At runtime this talks over the private service network. The build prerenders against
 * Meilisearch too, so it needs `MEILI_URL_BUILD` — whatever address the BUILDER can reach.
 * If the builder runs inside the cluster that is just the private address again; if not,
 * it has to be publicly routable.
 *
 * It is required, not optional. Falling back would point the build at a host it cannot
 * resolve, and because every query site wraps its call in `try/catch` that failure would
 * be swallowed into thousands of `notFound()` pages instead of a failed build.
 * `scripts/preflight-build.mjs` checks it is actually reachable before the build starts.
 *
 * Note this is deliberately NOT `NEXT_PUBLIC_MEILI_URL`. That one is the browser's address
 * and is still required at build time — Next inlines it into the client bundle — but it
 * need not be reachable from inside the builder.
 */
function buildPhaseHost() {
  const url = env.MEILI_URL_BUILD;
  if (!url) {
    throw new Error(
      "MEILI_URL_BUILD is required during `next build`. Set it to a Meilisearch address " +
        "the builder can reach; MEILI_URL_INTERNAL is resolved on the runtime network, " +
        "which may not exist at build time."
    );
  }
  return url;
}

export const meiliAdmin = new MeiliSearch({
  host: isBuildPhase ? buildPhaseHost() : env.MEILI_URL_INTERNAL,
  apiKey: env.MEILI_ADMIN_KEY,
  timeout: MEILI_REQUEST_TIMEOUT_MS,
});
