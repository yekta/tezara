import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { MeiliSearch } from "meilisearch";
import { env } from "@/lib/env";

const MEILI_REQUEST_TIMEOUT_MS = 15_000;

export const meili = new MeiliSearch({
  host: env.NEXT_PUBLIC_MEILI_URL,
  apiKey: env.NEXT_PUBLIC_MEILI_CLIENT_KEY,
  timeout: MEILI_REQUEST_TIMEOUT_MS,
  httpClient: (input, init) =>
    fetchWithTimeout(input, init, MEILI_REQUEST_TIMEOUT_MS),
});
