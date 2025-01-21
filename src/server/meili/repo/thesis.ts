import {
  PAGE_DEFAULT,
  TSearchLikePageParamsSearchProps,
} from "@/components/search/constants/shared";
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
  q,
  languages,
  thesis_types,
  universities,
  departments,
  advisors,
  authors,
  year_gte,
  year_lte,
  sort,
  hits_per_page,
  page = PAGE_DEFAULT,
  attributes_to_retrieve,
}: {
  sort: string[] | undefined;
  hits_per_page: number | undefined;
  attributes_to_retrieve?: (keyof TThesisExtended)[];
  client: MeiliSearch;
} & TSearchLikePageParamsSearchProps) {
  const index = client.index<TThesisExtended>(indexName);
  let filter = "";
  let languageFilter = "";
  let universityFilter = "";
  let departmentFilter = "";
  let advisorFilter = "";
  let authorsFilter = "";
  let thesisTypeFilter = "";

  if (languages && languages.length > 0) {
    const entries = languages.map((l) => `language = "${l}"`);
    languageFilter = `(${entries.join(" OR ")})`;
  }
  if (universities && universities.length > 0) {
    const entries = universities.map((u) => `university = "${u}"`);
    universityFilter = `(${entries.join(" OR ")})`;
  }
  if (departments && departments.length > 0) {
    const entries = departments.map((d) => `department = "${d}"`);
    departmentFilter = `(${entries.join(" OR ")})`;
  }
  if (advisors && advisors.length > 0) {
    const entries = advisors.map((a) => `advisors = "${a}"`);
    advisorFilter = `(${entries.join(" OR ")})`;
  }
  if (authors && authors.length > 0) {
    const entries = authors.map((a) => `author = "${a}"`);
    authorsFilter = `(${entries.join(" OR ")})`;
  }
  if (thesis_types && thesis_types.length > 0) {
    const entries = thesis_types.map((t) => `thesis_type = "${t}"`);
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

  if (departmentFilter.length > 0) {
    if (filter.length > 0) {
      filter += " AND ";
    }
    filter += departmentFilter;
  }

  if (advisorFilter.length > 0) {
    if (filter.length > 0) {
      filter += " AND ";
    }
    filter += advisorFilter;
  }

  if (authorsFilter.length > 0) {
    if (filter.length > 0) {
      filter += " AND ";
    }
    filter += authorsFilter;
  }

  if (thesisTypeFilter.length > 0) {
    if (filter.length > 0) {
      filter += " AND ";
    }
    filter += thesisTypeFilter;
  }

  if (year_gte) {
    if (filter.length > 0) {
      filter += " AND ";
    }
    filter += `year >= ${year_gte}`;
  }

  if (year_lte) {
    if (filter.length > 0) {
      filter += " AND ";
    }
    filter += `year <= ${year_lte}`;
  }

  const _sort =
    sort && sort.length > 0 ? sort : !q ? ["year:desc", "id:desc"] : undefined;

  const result = await index.search(q, {
    filter: filter ?? undefined,
    hitsPerPage: hits_per_page,
    page,
    sort: _sort,
    attributesToRetrieve: attributes_to_retrieve,
  });
  return result;
}
export type TSearchThesesResult = Awaited<ReturnType<typeof searchTheses>>;
