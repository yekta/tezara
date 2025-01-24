import { clickhouse } from "@/server/clickhouse/constants";
import { meiliAdmin } from "@/server/meili/constants-server";
import { searchTheses } from "@/server/meili/repo/thesis";
import sql from "sql-template-tag";
import { cache } from "react";

export const cachedGetPageData = cache(({ name }: { name: string }) =>
  getPageData({ name })
);

async function getPageData({ name }: { name: string }) {
  const thesisCountsByYearsPromise = clickhouse
    .query({
      query: sql`
      SELECT
        year,
        thesis_type,
        count() as count
      FROM theses
      WHERE university = {university: String}
      GROUP BY year, thesis_type
      ORDER BY year ASC
    `.text,
      query_params: {
        university: name,
      },
      format: "JSON",
    })
    .then((res) => res.json());

  const languagesPromise = clickhouse
    .query({
      query: sql`
      SELECT
        language,
        count() as count
      FROM theses
      WHERE university = {university: String}
      GROUP BY language
      ORDER BY count DESC
    `.text,
      query_params: {
        university: name,
      },
      format: "JSON",
    })
    .then((res) => res.json());

  const subjectsPromise = clickhouse
    .query({
      query: sql`
      SELECT 
          ts.subject_name,
          count() as count
      FROM theses t
      INNER JOIN thesis_subjects ts ON t.id = ts.thesis_id
      INNER JOIN subjects s ON ts.subject_name = s.name
      WHERE t.university = {university: String}
      AND s.language = 'Turkish'
      GROUP BY ts.subject_name
      ORDER BY count DESC
    `.text,
      query_params: {
        university: name,
      },
      format: "JSON",
    })
    .then((res) => res.json());

  const keywordsPromise = clickhouse
    .query({
      query: sql`
      SELECT 
          ts.keyword_name,
          count() as count
      FROM theses t
      INNER JOIN thesis_keywords ts ON t.id = ts.thesis_id
      INNER JOIN keywords s ON ts.keyword_name = s.name
      WHERE t.university = {university: String}
      AND s.language = 'Turkish'
      GROUP BY ts.keyword_name
      ORDER BY count DESC
    `.text,
      query_params: {
        university: name,
      },
      format: "JSON",
    })
    .then((res) => res.json());

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
  const [
    thesisCountsByYearsRes,
    languagesRes,
    subjectsRes,
    keywordsRes,
    lastThesesRes,
  ] = await Promise.all([
    thesisCountsByYearsPromise,
    languagesPromise,
    subjectsPromise,
    keywordsPromise,
    lastThesesPromise,
  ]);
  console.log(
    `university/[name]:getPageData() | ${Math.round(
      performance.now() - start
    ).toLocaleString()}ms`
  );

  const thesisCountsByYearsData = thesisCountsByYearsRes.data as {
    year: number;
    thesis_type: string;
    count: string;
  }[];

  const languagesData = languagesRes.data as {
    language: string;
    count: string;
  }[];

  const subjectsData = subjectsRes.data as {
    subject_name: string;
    count: string;
  }[];

  const keywordsData = keywordsRes.data as {
    keyword_name: string;
    count: string;
  }[];

  const thesesCountsByYears: Record<string, Record<string, number>> = {};
  let minYear = Infinity;
  let maxYear = -Infinity;
  let thesesCount = 0;
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
  };
}
