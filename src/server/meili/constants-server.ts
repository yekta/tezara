import "server-only";

import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { MeiliSearch } from "meilisearch";
import { env } from "@/lib/env";

const MEILI_REQUEST_TIMEOUT_MS = 15_000;

export const meiliAdmin = new MeiliSearch({
  host: env.MEILI_URL_INTERNAL,
  apiKey: env.MEILI_ADMIN_KEY,
  timeout: MEILI_REQUEST_TIMEOUT_MS,
  httpClient: (input, init) =>
    fetchWithTimeout(input, init, MEILI_REQUEST_TIMEOUT_MS),
});
