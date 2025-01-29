import { universitiesRoute } from "@/app/universities/_components/constants";
import {
  getUniversity,
  getUniversityStats,
} from "@/server/clickhouse/repo/university";
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
    search_on: [],
    attributes_to_retrieve: undefined,
    attributes_to_not_retrieve: ["abstract_original", "abstract_translated"],
    year_gte: null,
    year_lte: null,
    client: meiliAdmin,
  });
  const universityStatsPromise = getUniversity({ name });

  const start = performance.now();
  const [statsQueryRes, lastThesesRes, universityStats] = await Promise.all([
    statsQueryPromise,
    lastThesesPromise,
    universityStatsPromise,
  ]);
  console.log(
    `${universitiesRoute}/[name]:getPageData("${name}") | ${Math.round(
      performance.now() - start
    ).toLocaleString()}ms`
  );

  const { thesisCountsByYearsData, languagesData, subjectsData } =
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
    languagesData.map(({ language, count }) => [language, count])
  );
  const subjects = new Map<string, number>(
    subjectsData.map(({ subject_name, count }) => [subject_name, count])
  );
  const thesisTypes = new Map<string, number>();

  thesisCountsByYearsData.forEach(({ year, thesis_type, count }) => {
    const thesisTypeCount = thesisTypes.get(thesis_type) || 0;
    thesisTypes.set(thesis_type, thesisTypeCount + count);

    thesesCount += count;

    if (year < minYear) {
      minYear = year;
    }
    if (year > maxYear) {
      maxYear = year;
    }

    if (count < minThesisYear.count) {
      minThesisYear.year = year;
      minThesisYear.count = count;
    }

    if (count > maxThesisYear.count) {
      maxThesisYear.year = year;
      maxThesisYear.count = count;
    }

    if (!thesesCountsByYears[year]) {
      thesesCountsByYears[year] = {};
    }

    if (!thesesCountsByYears[year][thesis_type]) {
      thesesCountsByYears[year][thesis_type] = 0;
    }

    thesesCountsByYears[year][thesis_type] += count;
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
    universityStats,
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
