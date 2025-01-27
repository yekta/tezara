import { clickhouse } from "@/server/clickhouse/constants";
import { ResponseJSON } from "@clickhouse/client";
import sql from "sql-template-tag";

export async function getUniversities({
  page,
  perPage,
}: {
  page: number;
  perPage: number;
}) {
  const limit = perPage;
  const offset = (page - 1) * perPage;
  const res = await clickhouse.query({
    query: sql`
        SELECT *
        FROM universities
        ORDER BY thesis_count DESC
        LIMIT {limit: UInt32} OFFSET {offset: UInt32}
      `.text,
    query_params: {
      limit,
      offset,
    },
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
  }) as TUniversity[];
  return data;
}

export async function getUniversity({ name }: { name: string }) {
  const res = await clickhouse.query({
    query: sql`
        SELECT *
        FROM universities
        WHERE name = {name:String}
        LIMIT 1
      `.text,
    query_params: {
      name,
    },
    format: "JSON",
  });
  const resJson = await res.json();
  const data = resJson.data as TUniversity[];
  if (data.length === 0) {
    throw new Error("No data found");
  }
  return data[0];
}

export async function getTotalUniversityCount() {
  const res = await clickhouse.query({
    query: sql`
        SELECT count() as total_count
        FROM universities
      `.text,
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
    query: sql`
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
        FROM thesis_subject_stats
        WHERE university = {university:String}
          AND subject_language = 'Turkish'
        GROUP BY subject_name
      `.text,
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

export type TUniversity = {
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
