import { TSubject, TSubjectOrKeywordLanguage } from "@/server/meili/types";
import { MeiliSearch } from "meilisearch";

const indexName = "subjects";

export async function getSubjects({
  client,
  languages,
}: {
  client: MeiliSearch;
  languages: TSubjectOrKeywordLanguage[];
}) {
  const index = client.index<TSubject>(indexName);
  let filter = `name != "11111"`;
  if (languages.length > 0) {
    const entries = languages.map((l) => `language = "${l}"`);
    filter += ` AND (${entries.join(" OR ")})`;
  }
  const result = await index.search(undefined, {
    limit: 5000,
    sort: ["name:asc"],
    filter,
  });

  return result;
}

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
  languages: TSubjectOrKeywordLanguage[];
}) {
  const index = client.index<TSubject>(indexName);
  let filter = `name != "11111"`;
  if (languages.length > 0) {
    const entries = languages.map((l) => `language = "${l}"`);
    filter += `AND (${entries.join(" OR ")})`;
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
