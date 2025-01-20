import { meiliAdmin } from "@/server/meili/constants-server";
import { searchTheses } from "@/server/meili/repo/thesis";
import { cache } from "react";

export const cachedGetPageData = cache(({ name }: { name: string }) =>
  getPageData({ name })
);

async function getPageData({ name }: { name: string }) {
  const [mainRes, lastThesesRes] = await Promise.all([
    searchTheses({
      client: meiliAdmin,
      page: 1,
      hits_per_page: 100_000,
      universities: [name],
      attributes_to_retrieve: [
        "year",
        "language",
        "thesis_type",
        "keywords_turkish",
        "subjects_turkish",
      ],
      advisors: undefined,
      authors: undefined,
      languages: undefined,
      q: undefined,
      sort: undefined,
      thesis_types: undefined,
      year_gte: undefined,
      year_lte: undefined,
    }),
    searchTheses({
      hits_per_page: 10,
      page: 1,
      sort: ["year:desc", "id:desc"],
      universities: [name],
      languages: undefined,
      advisors: undefined,
      authors: undefined,
      q: undefined,
      thesis_types: undefined,
      year_gte: undefined,
      year_lte: undefined,
      client: meiliAdmin,
    }),
  ]);

  const keywords = new Set<string>();
  const languages = new Map<string, number>();
  const thesisTypes = new Map<string, number>();
  const subjects = new Map<string, number>();

  const thesesCountsByYears: Record<string, Record<string, number>> = {};
  mainRes.hits.forEach((hit) => {
    if (hit.keywords_turkish) {
      hit.keywords_turkish.forEach((keyword) => {
        keywords.add(keyword);
      });
    }
    if (hit.subjects_turkish) {
      hit.subjects_turkish.forEach((subject) => {
        const count = subjects.get(subject) || 0;
        subjects.set(subject, count + 1);
      });
    }
    if (hit.language) {
      const count = languages.get(hit.language) || 0;
      languages.set(hit.language, count + 1);
    }
    if (hit.thesis_type) {
      const count = thesisTypes.get(hit.thesis_type) || 0;
      thesisTypes.set(hit.thesis_type, count + 1);
    }
    const year = hit.year || "Bilinmiyor";
    const thesisType = hit.thesis_type || "Diğer";
    if (!thesesCountsByYears[year]) {
      thesesCountsByYears[year] = {};
    }
    if (!thesesCountsByYears[year][thesisType]) {
      thesesCountsByYears[year] = {
        ...thesesCountsByYears[year],
        [thesisType]: 1,
      };
    }
    thesesCountsByYears[year][thesisType] += 1;
  });

  const years = Object.keys(thesesCountsByYears).map(Number);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const allThesisTypes = new Set<string>();
  Object.values(thesesCountsByYears).forEach((thesesCount) => {
    Object.keys(thesesCount).forEach((thesisType) => {
      allThesisTypes.add(thesisType);
    });
  });

  const thesesCountsByYearsChartData: { [key: string]: string }[] = Array.from(
    { length: maxYear - minYear + 1 },
    (_, index) => {
      const year = String(minYear + index);
      const rest = thesesCountsByYears[year] || {};
      return {
        year,
        ...rest,
      };
    }
  );

  const popularSubjectsChartData = Array.from(subjects.entries())
    .map(([keyword, count]) => ({
      keyword,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    keywords,
    languages,
    subjects,
    thesesCountsByYearsChartData,
    popularSubjectsChartData,
    minYear,
    maxYear,
    thesisTypes,
    thesesCount: mainRes.hits.length,
    lastThesesRes: lastThesesRes.hits,
  };
}
