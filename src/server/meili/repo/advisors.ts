import { TAdvisor } from "@/server/meili/types";
import { MeiliSearch } from "meilisearch";

const indexName = "advisors";

export async function searchAdvisors({
  q,
  client,
}: {
  q: string;
  client: MeiliSearch;
}) {
  const index = client.index<TAdvisor>(indexName);
  const result = await index.search(q, {
    page: 1,
    hitsPerPage: 50,
    sort: ["name:asc"],
  });
  result.hits = result.hits.filter((h) => !h.name.includes("- -"));
  return result;
}

export type TSearchAdvisorsResult = Awaited<ReturnType<typeof searchAdvisors>>;
