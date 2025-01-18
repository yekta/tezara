import { OFFSET_DEFAULT } from "@/components/search/constants";
import { TThesisExtended } from "@/server/meili/types";
import { MeiliSearch } from "meilisearch";

const indexName = "theses";

export async function getThesis({
  client,
  id,
}: {
  client: MeiliSearch;
  id: number;
}) {
  const index = client.index<TThesisExtended>(indexName);
  const result = await index.getDocument(id);
  return result;
}
export type TGetThesisResult = Awaited<ReturnType<typeof getThesis>>;

export async function searchTheses({
  client,
  query,
  languages,
  thesisTypes,
  universities,
  sort,
  limit,
  offset = OFFSET_DEFAULT,
}: {
  client: MeiliSearch;
  query: string;
  languages?: string[];
  thesisTypes?: string[];
  universities?: string[];
  sort?: string[];
  limit?: number;
  offset?: number;
}) {
  const index = client.index<TThesisExtended>(indexName);
  let filter = "";
  let languageFilter = "";
  let universityFilter = "";
  let thesisTypeFilter = "";

  if (languages && languages.length > 0) {
    const entries = languages.map((l) => `language = "${l}"`);
    languageFilter = `(${entries.join(" OR ")})`;
  }
  if (universities && universities.length > 0) {
    const entries = universities.map((u) => `university = "${u}"`);
    universityFilter = `(${entries.join(" OR ")})`;
  }
  if (thesisTypes && thesisTypes.length > 0) {
    const entries = thesisTypes.map((t) => `thesis_type = "${t}"`);
    thesisTypeFilter = `(${entries.join(" OR ")})`;
  }

  if (languageFilter.length > 0) {
    filter += languageFilter;
  }

  if (universityFilter.length > 0) {
    if (filter.length > 0) {
      filter += " AND ";
    }
    filter += universityFilter;
  }

  if (thesisTypeFilter.length > 0) {
    if (filter.length > 0) {
      filter += " AND ";
    }
    filter += thesisTypeFilter;
  }

  const _sort =
    sort && sort.length > 0 ? sort : !query ? ["id:desc"] : undefined;

  const result = await index.search(query, {
    filter: filter ?? undefined,
    limit,
    offset,
    sort: _sort,
  });
  return result;
}
export type TSearchThesesResult = Awaited<ReturnType<typeof searchTheses>>;
