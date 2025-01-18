import { TThesisType } from "@/server/meili/types";
import { MeiliSearch } from "meilisearch";

const indexName = "thesis_types";

export async function getThesisTypes({ client }: { client: MeiliSearch }) {
  const index = client.index<TThesisType>(indexName);
  const result = await index.search();
  return result;
}
