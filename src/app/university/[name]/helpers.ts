import { getUniversityStats } from "@/server/clickhouse/repo/university";
import { meiliAdmin } from "@/server/meili/constants-server";
import { searchTheses } from "@/server/meili/repo/thesis";
import { cache } from "react";

export const cachedGetPageData = cache(({ name }: { name: string }) =>
  getPageData({ name })
);

async function getPageData({ name }: { name: string }) {
  const statsQueryPromise = getUniversityStats({ name });
  const lastThesesPromise = searchTheses({
    q: "",
    hits_per_page: 10,
    page: 1,
    sort: undefined,
    universities: [name],
    departments: [],
    languages: [],
    advisors: [],
    authors: [],
    thesis_types: [],
    attributes_to_retrieve: undefined,
    attributes_to_not_retrieve: ["abstract_original", "abstract_translated"],
    year_gte: null,
    year_lte: null,
    client: meiliAdmin,
  });

  const start = performance.now();
  const [statsQueryRes, lastThesesRes] = await Promise.all([
    statsQueryPromise,
    lastThesesPromise,
  ]);
  console.log(
    `/university/[name]:getPageData("${name}") | ${Math.round(
      performance.now() - start
    ).toLocaleString()}ms`
  );

  const { thesisCountsByYearsData, languagesData, subjectsData, keywordsData } =
    statsQueryRes;

  const thesesCountsByYears: Record<string, Record<string, number>> = {};
  let minYear = Infinity;
  let maxYear = -Infinity;
  let thesesCount = 0;
  const minThesisYear = {
    year: 2025,
    count: Infinity,
  };
  const maxThesisYear = {
    year: 2025,
    count: -Infinity,
  };

  const languages = new Map<string, number>(
    languagesData.map(({ language, count }) => [language, Number(count)])
  );
  const subjects = new Map<string, number>(
    subjectsData.map(({ subject_name, count }) => [subject_name, Number(count)])
  );
  const keywords = new Map<string, number>(
    keywordsData.map(({ keyword_name, count }) => [keyword_name, Number(count)])
  );
  const thesisTypes = new Map<string, number>();

  thesisCountsByYearsData.forEach(({ year, thesis_type, count }) => {
    const countAsNumber = Number(count);
    const thesisTypeCount = thesisTypes.get(thesis_type) || 0;
    thesisTypes.set(thesis_type, thesisTypeCount + countAsNumber);

    thesesCount += countAsNumber;

    if (year < minYear) {
      minYear = year;
    }
    if (year > maxYear) {
      maxYear = year;
    }

    if (countAsNumber < minThesisYear.count) {
      minThesisYear.year = year;
      minThesisYear.count = countAsNumber;
    }

    if (countAsNumber > maxThesisYear.count) {
      maxThesisYear.year = year;
      maxThesisYear.count = countAsNumber;
    }

    if (!thesesCountsByYears[year]) {
      thesesCountsByYears[year] = {};
    }

    if (!thesesCountsByYears[year][thesis_type]) {
      thesesCountsByYears[year][thesis_type] = 0;
    }

    thesesCountsByYears[year][thesis_type] += countAsNumber;
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

  let mostPopularThesisType = {
    thesis_type: "Yüksek Lisans",
    count: -Infinity,
  };

  for (const [thesis_type, count] of thesisTypes.entries()) {
    if (count > mostPopularThesisType.count) {
      mostPopularThesisType = {
        thesis_type,
        count,
      };
    }
  }

  const popularSubjectsChartData = Array.from(subjects.entries())
    .map(([keyword, count]) => ({
      keyword,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    thesesCountsByYearsChartData,
    popularSubjectsChartData,
    keywords,
    subjects,
    languages,
    minYear,
    maxYear,
    thesisTypes,
    thesesCount,
    lastThesesRes,
    maxThesisYear,
    minThesisYear,
    mostPopularThesisType,
  };
}
