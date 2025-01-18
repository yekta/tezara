import "server-only";

import { MeiliSearch } from "meilisearch";
import { env } from "@/lib/env";

export const meiliAdmin = new MeiliSearch({
  host: env.MEILI_URL_INTERNAL,
  apiKey: env.MEILI_ADMIN_KEY,
});

export const meiliInternal = new MeiliSearch({
  host: env.MEILI_URL_INTERNAL,
  apiKey: env.NEXT_PUBLIC_MEILI_CLIENT_KEY,
});
