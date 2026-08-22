import { MeiliSearch } from "meilisearch";

const REQUEST_TIMEOUT_MS = 15_000;

export function createMeiliClient(opts: { host: string; apiKey: string }): MeiliSearch {
  return new MeiliSearch({ host: opts.host, apiKey: opts.apiKey, timeout: REQUEST_TIMEOUT_MS });
}

export type { MeiliSearch };
