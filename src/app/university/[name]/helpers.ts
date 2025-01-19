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
      hitsPerPage: 100_000,
      universities: [name],
      page: 1,
      languages: undefined,
      query: undefined,
      sort: undefined,
      thesisTypes: undefined,
      yearGte: undefined,
      yearLte: undefined,
      attributesToRetrieve: [
        "year",
        "language",
        "thesis_type",
        "keywords_turkish",
        "subjects_turkish",
      ],
    }),
    searchTheses({
      client: meiliAdmin,
      hitsPerPage: 10,
      universities: [name],
      page: 1,
      languages: undefined,
      query: undefined,
      sort: ["year:desc", "id:desc"],
      thesisTypes: undefined,
      yearGte: undefined,
      yearLte: undefined,
    }),
  ]);

  const keywords = new Set<string>();
  const languages = new Set<string>();
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
      languages.add(hit.language);
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
  const thesisTypes = Array.from(allThesisTypes);

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
