import "server-only";

import { MeiliSearch } from "meilisearch";
import { env } from "@/lib/env";

export const meiliAdmin = new MeiliSearch({
  host: env.MEILI_URL_INTERNAL,
  apiKey: env.MEILI_ADMIN_KEY,
});
