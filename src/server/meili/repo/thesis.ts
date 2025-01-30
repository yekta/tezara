import {
  PAGE_DEFAULT,
  TSearchLikePageParamsSearchProps,
} from "@/components/search/constants";
import {
  allThesisAttributes,
  TThesisAttribute,
  TThesis,
} from "@/server/meili/types";
import { MeiliSearch } from "meilisearch";

const indexName = "theses";

export async function getThesis({
  client,
  id,
}: {
  client: MeiliSearch;
  id: number;
}) {
  const index = client.index<TThesis>(indexName);
  const result = await index.getDocument(id);
  return result;
}
export type TGetThesisResult = Awaited<ReturnType<typeof getThesis>>;

export async function searchTheses({
  client,
  q,
  languages,
  universities,
  departments,
  advisors,
  authors,
  year_gte,
  year_lte,
  thesis_types,
  subjects,
  sort,
  hits_per_page,
  page = PAGE_DEFAULT,
  attributes_to_retrieve,
  attributes_to_not_retrieve,
  search_on,
}: {
  sort: string[] | undefined;
  hits_per_page: number | undefined;
  attributes_to_retrieve: TThesisAttribute[] | undefined;
  attributes_to_not_retrieve: TThesisAttribute[] | undefined;
  client: MeiliSearch;
} & TSearchLikePageParamsSearchProps) {
  const index = client.index<TThesis>(indexName);
  let filter = "";
  let languageFilter = "";
  let universityFilter = "";
  let departmentFilter = "";
  let advisorFilter = "";
  let authorsFilter = "";
  let thesisTypeFilter = "";
  let subjectFilter = "";

  if (attributes_to_not_retrieve && attributes_to_not_retrieve.length > 0) {
    attributes_to_retrieve = allThesisAttributes.filter(
      (attr) => !attributes_to_not_retrieve?.includes(attr)
    );
  }

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
  if (subjects && subjects.length > 0) {
    const entries = subjects.map((s) => `subjects.name = "${s}"`);
    subjectFilter = `(${entries.join(" OR ")})`;
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

  if (subjectFilter.length > 0) {
    if (filter.length > 0) {
      filter += " AND ";
    }
    filter += subjectFilter;
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

  const attributesToSearchOn = [];
  if (search_on?.length > 0) {
    if (search_on.includes("title")) {
      attributesToSearchOn.push("title_original");
      attributesToSearchOn.push("title_translated");
    }
    if (search_on.includes("abstract")) {
      attributesToSearchOn.push("abstract_original");
      attributesToSearchOn.push("abstract_translated");
    }
    if (search_on.includes("subjects")) {
      attributesToSearchOn.push("subjects.name");
    }
    if (search_on.includes("keywords")) {
      attributesToSearchOn.push("keywords.name");
    }
    if (search_on.includes("author")) {
      attributesToSearchOn.push("author");
    }
    if (search_on.includes("advisors")) {
      attributesToSearchOn.push("advisors");
    }
  }

  const result = await index.search(q, {
    filter: filter ?? undefined,
    hitsPerPage: hits_per_page,
    page,
    sort: _sort,
    attributesToRetrieve: attributes_to_retrieve,
    attributesToSearchOn:
      attributesToSearchOn.length > 0 ? attributesToSearchOn : undefined,
  });

  return result;
}
export type TSearchThesesResult = Awaited<ReturnType<typeof searchTheses>>;
