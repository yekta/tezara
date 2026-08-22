import type { ClickHouseClient } from "./client.ts";

/**
 * Rebuild the aggregate tables the web app reads.
 *
 * Blue/green: build into a shadow table, then EXCHANGE TABLES atomically. Readers see
 * either the old contents or the new ones, never an empty table.
 *
 * This is the direct replacement for `create-schema.ts`, which DROPped `universities`
 * and `subject_stats` and repopulated them on every push — while /universities and
 * /subjects were serving reads from exactly those tables.
 *
 * FINAL is required on every read: ReplacingMergeTree only dedups at merge time, so
 * without it a thesis re-crawled today would be counted twice.
 */
const UNIVERSITIES_SELECT = `
  SELECT
    t.university AS name,
    countDistinct(t.id)                      AS thesis_count,
    countDistinct(t.language)                AS language_count,
    countDistinct(t.author)                  AS author_count,
    countDistinct(t.thesis_type)             AS thesis_type_count,
    countDistinct(t.institute)               AS institute_count,
    countDistinct(t.department)              AS department_count,
    countDistinct(t.branch)                  AS branch_count,
    countDistinctIf(tk.keyword_name, k.language = 'Turkish') AS keyword_count_turkish,
    countDistinctIf(ts.subject_name, s.language = 'Turkish') AS subject_count_turkish,
    countDistinctIf(tk.keyword_name, k.language = 'English') AS keyword_count_english,
    countDistinctIf(ts.subject_name, s.language = 'English') AS subject_count_english,
    min(t.year) AS year_start,
    max(t.year) AS year_end
  FROM theses AS t FINAL
  LEFT JOIN thesis_keywords AS tk FINAL ON t.id = tk.thesis_id
  LEFT JOIN thesis_subjects AS ts FINAL ON t.id = ts.thesis_id
  LEFT JOIN keywords AS k FINAL ON k.name = tk.keyword_name
  LEFT JOIN subjects AS s FINAL ON s.name = ts.subject_name
  GROUP BY t.university`;

const SUBJECT_STATS_SELECT = `
  SELECT
    s.name AS name,
    s.language AS language,
    countDistinct(t.id)              AS thesis_count,
    countDistinct(t.language)        AS language_count,
    countDistinct(t.author)          AS author_count,
    countDistinct(t.thesis_type)     AS thesis_type_count,
    countDistinct(t.university)      AS university_count,
    countDistinct(t.institute)       AS institute_count,
    countDistinct(t.department)      AS department_count,
    countDistinct(t.branch)          AS branch_count,
    countDistinctIf(tk.keyword_name, k.language = 'Turkish') AS keyword_count_turkish,
    countDistinctIf(tk.keyword_name, k.language = 'English') AS keyword_count_english,
    min(t.year) AS year_start,
    max(t.year) AS year_end
  FROM theses AS t FINAL
  INNER JOIN thesis_subjects AS ts FINAL ON t.id = ts.thesis_id
  INNER JOIN subjects AS s FINAL ON s.name = ts.subject_name
  LEFT JOIN thesis_keywords AS tk FINAL ON t.id = tk.thesis_id
  LEFT JOIN keywords AS k FINAL ON k.name = tk.keyword_name
  GROUP BY s.name, s.language`;

const SUBJECTS_BY_UNIVERSITY_SELECT = `
  SELECT
    t.university AS university,
    ts.subject_name AS subject_name,
    s.language AS subject_language,
    count() AS count
  FROM theses AS t FINAL
  INNER JOIN thesis_subjects AS ts FINAL ON t.id = ts.thesis_id
  INNER JOIN subjects AS s FINAL ON s.name = ts.subject_name
  GROUP BY t.university, ts.subject_name, s.language`;

const TARGETS = [
  { table: "universities", select: UNIVERSITIES_SELECT },
  { table: "subject_stats", select: SUBJECT_STATS_SELECT },
  { table: "thesis_subjects_by_university", select: SUBJECTS_BY_UNIVERSITY_SELECT },
] as const;

export async function rebuildAggregates(client: ClickHouseClient): Promise<string[]> {
  const rebuilt: string[] = [];

  for (const { table, select } of TARGETS) {
    const shadow = `${table}__rebuild`;
    // Shadow tables are internal scratch, never read by the app — safe to drop.
    await client.command({ query: `DROP TABLE IF EXISTS ${shadow}` });
    await client.command({ query: `CREATE TABLE ${shadow} AS ${table}` });
    await client.command({ query: `INSERT INTO ${shadow} ${select}` });
    // Atomic: readers see old or new, never nothing.
    await client.command({ query: `EXCHANGE TABLES ${table} AND ${shadow}` });
    await client.command({ query: `DROP TABLE IF EXISTS ${shadow}` });
    rebuilt.push(table);
  }

  return rebuilt;
}
