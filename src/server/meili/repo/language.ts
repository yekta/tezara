import { TLanguage } from "@/server/meili/types";
import { MeiliSearch } from "meilisearch";

const indexName = "languages";

export async function getLanguages({ client }: { client: MeiliSearch }) {
  const index = client.index<TLanguage>(indexName);
  const result = await index.search();
  return result;
}
