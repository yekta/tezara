import { clickhouse } from "@/server/clickhouse/constants";
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
        WITH total_count AS (
            SELECT count(*) AS c
            FROM universities
        )
        SELECT
            u.*,
            total_count.c AS total_count
        FROM universities AS u
        CROSS JOIN total_count
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

type TUniversity = {
  name: string;
  thesis_count: number;
  language_count: number;
  author_count: number;
  thesis_type_count: number;
  institute_count: number;
  department_count: number;
  branch_count: number;
  turkish_keyword_count: number;
  turkish_subject_count: number;
  english_keyword_count: number;
  english_subject_count: number;
  year_start: number;
  year_end: number;
  total_count: number;
};
