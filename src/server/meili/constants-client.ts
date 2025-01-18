import { MeiliSearch } from "meilisearch";
import { env } from "@/lib/env";

export const meili = new MeiliSearch({
  host: env.NEXT_PUBLIC_MEILI_URL,
  apiKey: env.NEXT_PUBLIC_MEILI_CLIENT_KEY,
});
