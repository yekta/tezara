import { isThesisBlocked } from "@/server/blocked-theses";
import { meiliAdmin } from "@/server/meili/constants-server";
import {
  getThesesByIds,
  getThesis,
  searchTheses,
} from "@/server/meili/repo/thesis";
import { TThesis, TThesisAttribute } from "@/server/meili/types";
import { cacheWithRedis } from "@/server/redis/constants";
import { cache } from "react";

const similarThesesCount = 6;
const similarThesisRowFields: TThesisAttribute[] = [
  "id",
  "pdf_url",
  "title_original",
  "title_translated",
  "author",
  "thesis_type",
  "language",
  "year",
  "university",
  "department",
];

export const cachedGetPageData = cache(({ id }: { id: string }) =>
  getPageData({ id })
);

export async function getPageData({ id }: { id: string }) {
  const idNumber = parseInt(id);
  if (isThesisBlocked(idNumber)) return { thesis: null };

  const thesis = await getThesis({ id: idNumber, client: meiliAdmin });
  return {
    thesis,
  };
}

export async function getSimilarTheses(thesis: TThesis) {
  const ids = await cacheWithRedis(
    `similarThesisIds:${thesis.id}`,
    () => searchSimilarThesisIds(thesis),
    "week"
  )();
  return getThesesByIds({
    client: meiliAdmin,
    ids,
    fields: similarThesisRowFields,
  });
}

async function searchSimilarThesisIds(thesis: TThesis) {
  const result = await searchTheses({
    q: thesis.title_original || thesis.title_translated || "",
    disable_ranking_score_threshold: true,
    hits_per_page: similarThesesCount,
    page: 1,
    languages: [],
    thesis_types: [],
    universities: [],
    departments: [],
    authors: [],
    advisors: [],
    subjects: [],
    sort: undefined,
    year_gte: null,
    year_lte: null,
    search_on: [],
    attributes_to_retrieve: ["id"],
    attributes_to_not_retrieve: undefined,
    client: meiliAdmin,
  });
  return result.hits.map((hit) => hit.id).filter((id) => id !== thesis.id);
}
