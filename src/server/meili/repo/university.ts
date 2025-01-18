import { TUniversity } from "@/server/meili/types";
import { MeiliSearch } from "meilisearch";

const indexName = "universities";

export async function getUniversities({ client }: { client: MeiliSearch }) {
  const index = client.index<TUniversity>(indexName);
  const result = await index.search();
  return result;
}
