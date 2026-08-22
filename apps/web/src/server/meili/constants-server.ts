import "server-only";

import { MeiliSearch } from "meilisearch";
import { env } from "@/lib/env";
import { isBuildPhase } from "@/server/build-phase";

const MEILI_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Server-side Meilisearch client.
 *
 * At runtime this talks over the private network. During `next build` that network does
 * not exist, so it falls back to the public URL the browser already uses — which is
 * required at build time anyway, since Next inlines it into the client bundle.
 */
export const meiliAdmin = new MeiliSearch({
  host: isBuildPhase ? env.NEXT_PUBLIC_MEILI_URL : env.MEILI_URL_INTERNAL,
  apiKey: env.MEILI_ADMIN_KEY,
  timeout: MEILI_REQUEST_TIMEOUT_MS,
});
