import { clickhouse } from "@/server/clickhouse/constants";
import { meiliAdmin } from "@/server/meili/constants-server";
import { searchUniversities } from "@/server/meili/repo/university";
import { ResponseJSON } from "@clickhouse/client";

export async function getUniversities({
  page,
  perPage,
  q,
}: {
  page: number;
  perPage: number;
  q?: string;
}) {
  const limit = perPage;
  const offset = (page - 1) * perPage;
  let query = `
    SELECT *
    FROM universities
  `;
  const query_params: Record<string, number | string[]> = {
    limit,
    offset,
  };
  let searchResults: string[] | null = null;
  if (q) {
    const res = await searchUniversities({ q, client: meiliAdmin });
    searchResults = res.hits.map((h) => h.name);
  }
  if (searchResults) {
    query += `
      WHERE name IN {university_names:Array(String)}
    `;
    query_params.university_names = searchResults;
  }
  query += `
    ORDER BY thesis_count DESC
    LIMIT {limit: UInt32} OFFSET {offset: UInt32}
  `;

  const res = await clickhouse.query({
    query,
    query_params,
    format: "JSON",
  });
  const resJson = await res.json();

  const data = resJson.data.map((d) => {
    const { name, ...rest } = d as Record<string, string>;
    const obj: Record<string, number> = {};
    for (const key in rest) {
      obj[key] = Number(rest[key]);
    }
    return {
      name,
      ...obj,
    };
  }) as TUniversityUnparsed[];

  const dataParsed: TUniversity[] = data.map((d) => ({
    name: d.name,
    thesis_count: Number(d.thesis_count),
    language_count: Number(d.language_count),
    author_count: Number(d.author_count),
    thesis_type_count: Number(d.thesis_type_count),
    institute_count: Number(d.institute_count),
    department_count: Number(d.department_count),
    branch_count: Number(d.branch_count),
    keyword_count_turkish: Number(d.keyword_count_turkish),
    subject_count_turkish: Number(d.subject_count_turkish),
    keyword_count_english: Number(d.keyword_count_english),
    subject_count_english: Number(d.subject_count_english),
    year_start: Number(d.year_start),
    year_end: Number(d.year_end),
    total_count: Number(d.total_count),
  }));

  return dataParsed;
}

export async function getUniversity({ name }: { name: string }) {
  const res = await clickhouse.query({
    query: `
      SELECT *
      FROM universities
      WHERE name = {name:String}
      LIMIT 1
    `,
    query_params: {
      name,
    },
    format: "JSON",
  });
  const resJson = await res.json();
  const data = resJson.data as TUniversityUnparsed[];
  if (data.length === 0) {
    throw new Error("No data found");
  }
  const item = data[0];
  const itemParsed: TUniversity = {
    name: item.name,
    author_count: Number(item.author_count),
    branch_count: Number(item.branch_count),
    department_count: Number(item.department_count),
    institute_count: Number(item.institute_count),
    keyword_count_english: Number(item.keyword_count_english),
    keyword_count_turkish: Number(item.keyword_count_turkish),
    language_count: Number(item.language_count),
    subject_count_english: Number(item.subject_count_english),
    subject_count_turkish: Number(item.subject_count_turkish),
    thesis_count: Number(item.thesis_count),
    thesis_type_count: Number(item.thesis_type_count),
    total_count: Number(item.total_count),
    year_end: Number(item.year_end),
    year_start: Number(item.year_start),
  };
  return itemParsed;
}

export async function getTotalUniversityCount({ q }: { q?: string }) {
  let query = `
    SELECT count() as total_count
    FROM universities
  `;
  const query_params: Record<string, string[]> = {};
  let searchResults: string[] | null = null;
  if (q) {
    const res = await searchUniversities({ q, client: meiliAdmin });
    searchResults = res.hits.map((h) => h.name);
  }
  if (searchResults) {
    query += `
      WHERE name IN {university_names:Array(String)}
    `;
    query_params.university_names = searchResults;
  }
  const res = await clickhouse.query({
    query,
    query_params,
    format: "JSON",
  });
  const resJson = await res.json();
  const data = resJson.data as { total_count: string }[];
  if (data.length === 0) {
    throw new Error("No data found");
  }
  return Number(data[0].total_count);
}

export async function getUniversityStats({ name }: { name: string }) {
  const res = await clickhouse.query({
    query: `
      SELECT
          'year_type'   AS data_group,
          year,
          thesis_type,
          NULL          AS language,
          NULL          AS subject_name,
          NULL          AS keyword_name,
          count()       AS count
      FROM theses
      WHERE university = {university:String}
      GROUP BY year, thesis_type

      UNION ALL

      SELECT
          'language'    AS data_group,
          NULL          AS year,
          NULL          AS thesis_type,
          language,
          NULL          AS subject_name,
          NULL          AS keyword_name,
          count()       AS count
      FROM theses
      WHERE university = {university:String}
      GROUP BY language

      UNION ALL

      SELECT
          'subject'     AS data_group,
          NULL          AS year,
          NULL          AS thesis_type,
          NULL          AS language,
          subject_name,
          NULL          AS keyword_name,
          sum(count)    AS count
      FROM thesis_subjects_by_university
      WHERE university = {university:String}
        AND subject_language = 'Turkish'
      GROUP BY subject_name
    `,
    query_params: {
      university: name,
    },
    format: "JSON",
  });
  const resJson = await res.json();
  const { thesisCountsByYearsData, languagesData, subjectsData } =
    parseStatsQueryRes(resJson);
  return {
    thesisCountsByYearsData,
    languagesData,
    subjectsData,
  };
}

export type TUniversityUnparsed = {
  name: string;
  thesis_count: string;
  language_count: string;
  author_count: string;
  thesis_type_count: string;
  institute_count: string;
  department_count: string;
  branch_count: string;
  keyword_count_turkish: string;
  subject_count_turkish: string;
  keyword_count_english: string;
  subject_count_english: string;
  year_start: string;
  year_end: string;
  total_count: string;
};

export type TUniversity = {
  name: string;
  thesis_count: number;
  language_count: number;
  author_count: number;
  thesis_type_count: number;
  institute_count: number;
  department_count: number;
  branch_count: number;
  keyword_count_turkish: number;
  subject_count_turkish: number;
  keyword_count_english: number;
  subject_count_english: number;
  year_start: number;
  year_end: number;
  total_count: number;
};

function parseStatsQueryRes(response: ResponseJSON<unknown>): QueryStatsParsed {
  // Typically, response.data is the array of rows from ClickHouse
  const rows = (Array.isArray(response?.data) ? response.data : []) as Record<
    string,
    string
  >[];

  // Prepare our four result arrays
  const thesisCountsByYearsData: ThesisCountsByYearsRow[] = [];
  const languagesData: LanguagesRow[] = [];
  const subjectsData: SubjectsRow[] = [];
  const keywordsData: KeywordsRow[] = [];

  for (const row of rows) {
    // Data group (discriminator)
    const dataGroup = row.data_group as CombinedRow["data_group"] | undefined;
    // Ensure count is a number
    const count = Number(row.count) || 0;

    switch (dataGroup) {
      case "year_type":
        thesisCountsByYearsData.push({
          data_group: "year_type",
          year: parseInt(row.year) ?? 0,
          thesis_type: row.thesis_type ?? "",
          count,
        });
        break;

      case "language":
        languagesData.push({
          data_group: "language",
          language: row.language ?? "",
          count,
        });
        break;

      case "subject":
        subjectsData.push({
          data_group: "subject",
          subject_name: row.subject_name ?? "",
          count,
        });
        break;

      case "keyword":
        keywordsData.push({
          data_group: "keyword",
          keyword_name: row.keyword_name ?? "",
          count,
        });
        break;

      default:
        // If there's something unexpected, ignore or throw error
        console.warn("Unexpected row data_group:", dataGroup, row);
        break;
    }
  }

  return {
    thesisCountsByYearsData,
    languagesData,
    subjectsData,
  };
}

export type QueryStatsParsed = {
  thesisCountsByYearsData: ThesisCountsByYearsRow[];
  languagesData: LanguagesRow[];
  subjectsData: SubjectsRow[];
};

export type ThesisCountsByYearsRow = {
  data_group: "year_type";
  year: number;
  thesis_type: string;
  count: number;
};

export type LanguagesRow = {
  data_group: "language";
  language: string;
  count: number;
};

export type SubjectsRow = {
  data_group: "subject";
  subject_name: string;
  count: number;
};

export type KeywordsRow = {
  data_group: "keyword";
  keyword_name: string;
  count: number;
};

/**
 * A single row from the combined query.
 * Discriminates based on `data_group`.
 */
export type CombinedRow =
  | ThesisCountsByYearsRow
  | LanguagesRow
  | SubjectsRow
  | KeywordsRow;
