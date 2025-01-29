import { TLanguage, TUniversity } from "@/server/meili/types";
import { MeiliSearch } from "meilisearch";

const indexName = "subjects";

export async function searchSubjects({
  q,
  client,
  hits_per_page = 100,
  page = 1,
  languages,
}: {
  q: string;
  client: MeiliSearch;
  page?: number;
  hits_per_page?: number;
  languages: TLanguage[];
}) {
  const index = client.index<TUniversity>(indexName);
  let filter = "";
  if (languages.length > 0) {
    const entries = languages.map((l) => `language = "${l}"`);
    filter = `(${entries.join(" OR ")})`;
  }
  const result = await index.search(q, {
    page,
    hitsPerPage: hits_per_page,
    sort: ["name:asc"],
    attributesToRetrieve: ["name"],
    attributesToSearchOn: ["name"],
    filter,
  });

  return result;
}
