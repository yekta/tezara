import type { ClickHouseSettings } from "@clickhouse/client";
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
 *
 * Every count is exact (countDistinct = uniqExact). The queries are shaped to keep that
 * affordable on a small server:
 *
 *   - Thesis-level counts (languages, authors, …) come from a single pass over `theses`.
 *     The previous shape LEFT JOINed keywords and subjects first, so each thesis was
 *     repeated (#keywords × #subjects) times before the GROUP BY saw it, and every
 *     countDistinct kept a hash set over that multiplied stream.
 *   - Keyword and subject counts are their own sub-aggregates, each joining only the two
 *     narrow columns it needs, and are attached to the thesis-level rows by key.
 *   - The large table is always on the left of a JOIN; the right (hashed) side is a
 *     projection of exactly the columns the join needs.
 */

const UNIVERSITIES_SELECT = `
  SELECT
    b.name                  AS name,
    b.thesis_count          AS thesis_count,
    b.language_count        AS language_count,
    b.author_count          AS author_count,
    b.thesis_type_count     AS thesis_type_count,
    b.institute_count       AS institute_count,
    b.department_count      AS department_count,
    b.branch_count          AS branch_count,
    kw.keyword_count_turkish AS keyword_count_turkish,
    sb.subject_count_turkish AS subject_count_turkish,
    kw.keyword_count_english AS keyword_count_english,
    sb.subject_count_english AS subject_count_english,
    b.year_start            AS year_start,
    b.year_end              AS year_end
  FROM (
    SELECT
      university                 AS name,
      count()                    AS thesis_count,
      countDistinct(language)    AS language_count,
      countDistinct(author)      AS author_count,
      countDistinct(thesis_type) AS thesis_type_count,
      countDistinct(institute)   AS institute_count,
      countDistinct(department)  AS department_count,
      countDistinct(branch)      AS branch_count,
      min(year)                  AS year_start,
      max(year)                  AS year_end
    FROM theses FINAL
    GROUP BY university
  ) AS b
  LEFT JOIN (
    SELECT
      t.university AS name,
      countDistinctIf(tk.keyword_name, k.language = 'Turkish') AS keyword_count_turkish,
      countDistinctIf(tk.keyword_name, k.language = 'English') AS keyword_count_english
    FROM thesis_keywords AS tk FINAL
    INNER JOIN (SELECT id, university FROM theses FINAL) AS t ON t.id = tk.thesis_id
    INNER JOIN (SELECT name, language FROM keywords FINAL) AS k ON k.name = tk.keyword_name
    GROUP BY t.university
  ) AS kw ON kw.name = b.name
  LEFT JOIN (
    SELECT
      t.university AS name,
      countDistinctIf(ts.subject_name, s.language = 'Turkish') AS subject_count_turkish,
      countDistinctIf(ts.subject_name, s.language = 'English') AS subject_count_english
    FROM thesis_subjects AS ts FINAL
    INNER JOIN (SELECT id, university FROM theses FINAL) AS t ON t.id = ts.thesis_id
    INNER JOIN (SELECT name, language FROM subjects FINAL) AS s ON s.name = ts.subject_name
    GROUP BY t.university
  ) AS sb ON sb.name = b.name`;

const SUBJECT_STATS_SELECT = `
  SELECT
    s.name                   AS name,
    s.language               AS language,
    b.thesis_count           AS thesis_count,
    b.language_count         AS language_count,
    b.author_count           AS author_count,
    b.thesis_type_count      AS thesis_type_count,
    b.university_count       AS university_count,
    b.institute_count        AS institute_count,
    b.department_count       AS department_count,
    b.branch_count           AS branch_count,
    kw.keyword_count_turkish AS keyword_count_turkish,
    kw.keyword_count_english AS keyword_count_english,
    b.year_start             AS year_start,
    b.year_end               AS year_end
  FROM (SELECT name, language FROM subjects FINAL) AS s
  INNER JOIN (
    SELECT
      ts.subject_name              AS name,
      count()                      AS thesis_count,
      countDistinct(t.language)    AS language_count,
      countDistinct(t.author)      AS author_count,
      countDistinct(t.thesis_type) AS thesis_type_count,
      countDistinct(t.university)  AS university_count,
      countDistinct(t.institute)   AS institute_count,
      countDistinct(t.department)  AS department_count,
      countDistinct(t.branch)      AS branch_count,
      min(t.year)                  AS year_start,
      max(t.year)                  AS year_end
    FROM theses AS t FINAL
    INNER JOIN (SELECT thesis_id, subject_name FROM thesis_subjects FINAL) AS ts
      ON ts.thesis_id = t.id
    GROUP BY ts.subject_name
  ) AS b ON b.name = s.name
  LEFT JOIN (
    SELECT
      ts.subject_name AS name,
      countDistinctIf(tk.keyword_name, k.language = 'Turkish') AS keyword_count_turkish,
      countDistinctIf(tk.keyword_name, k.language = 'English') AS keyword_count_english
    FROM thesis_subjects AS ts FINAL
    INNER JOIN (SELECT thesis_id, keyword_name FROM thesis_keywords FINAL) AS tk
      ON tk.thesis_id = ts.thesis_id
    INNER JOIN (SELECT name, language FROM keywords FINAL) AS k ON k.name = tk.keyword_name
    WHERE ts.thesis_id IN (SELECT id FROM theses FINAL)
    GROUP BY ts.subject_name
  ) AS kw ON kw.name = s.name`;

const SUBJECTS_BY_UNIVERSITY_SELECT = `
  SELECT
    t.university    AS university,
    ts.subject_name AS subject_name,
    s.language      AS subject_language,
    count()         AS count
  FROM theses AS t FINAL
  INNER JOIN (SELECT thesis_id, subject_name FROM thesis_subjects FINAL) AS ts
    ON ts.thesis_id = t.id
  INNER JOIN (SELECT name, language FROM subjects FINAL) AS s ON s.name = ts.subject_name
  GROUP BY t.university, ts.subject_name, s.language`;

const TARGETS = [
  { table: "universities", select: UNIVERSITIES_SELECT },
  { table: "subject_stats", select: SUBJECT_STATS_SELECT },
  { table: "thesis_subjects_by_university", select: SUBJECTS_BY_UNIVERSITY_SELECT },
] as const;

/**
 * Trade speed for a bounded memory footprint on the INSERT … SELECT.
 *
 * The rebuild is a background job on a server that also holds the live tables, their
 * merges, and every query the web app makes, under one `max_server_memory_usage`.
 * Exceeding that does not fail politely: the OvercommitTracker picks a query and kills
 * it, and the one it picks is not necessarily this one. Keeping the rebuild well clear
 * of the server limit is therefore as much about the site staying up as it is about the
 * aggregates landing.
 *
 * Each spill threshold is expressed as a RATIO of memory still available rather than a
 * byte count, because a byte count is only ever right for one machine.
 *
 *   - external GROUP BY / sort: aggregation states flush to disk past the threshold and
 *     are merged back at the end. Exact results, slower.
 *   - external JOIN: this is the one that was missing. `max_bytes_ratio_before_external_join`
 *     defaults to 0.5, and nothing here set it — so while aggregation was held to a few
 *     hundred MB, the join side was left free to use half of whatever was available
 *     before spilling, on the same query, at the same time.
 *   - max_threads = 1: each aggregation thread builds its own hash table before the
 *     merge, so peak memory scales with thread count. Nobody is waiting on this job.
 *   - join_use_nulls = 0: a university with no keywords gets 0, not NULL, from the LEFT
 *     JOIN — the target columns are non-nullable.
 *
 * The absolute thresholds are pinned to 0 (their default) so that the ratios are
 * unambiguously the knob that governs this, and there is one number to change.
 */
export const REBUILD_SETTINGS: ClickHouseSettings = {
  max_bytes_ratio_before_external_group_by: 0.15,
  max_bytes_ratio_before_external_sort: 0.15,
  max_bytes_ratio_before_external_join: 0.15,
  max_bytes_before_external_group_by: "0",
  max_bytes_before_external_sort: "0",
  join_algorithm: "grace_hash",
  max_threads: 1,
  join_use_nulls: 0,
};

export async function rebuildAggregates(
  client: ClickHouseClient,
  opts: { settings?: ClickHouseSettings } = {},
): Promise<string[]> {
  const rebuilt: string[] = [];
  const clickhouse_settings = { ...REBUILD_SETTINGS, ...opts.settings };

  for (const { table, select } of TARGETS) {
    const shadow = `${table}__rebuild`;
    // Shadow tables are internal scratch, never read by the app — safe to drop.
    await client.command({ query: `DROP TABLE IF EXISTS ${shadow}` });
    await client.command({ query: `CREATE TABLE ${shadow} AS ${table}` });
    await client.command({ query: `INSERT INTO ${shadow} ${select}`, clickhouse_settings });
    // Atomic: readers see old or new, never nothing.
    await client.command({ query: `EXCHANGE TABLES ${table} AND ${shadow}` });
    await client.command({ query: `DROP TABLE IF EXISTS ${shadow}` });
    rebuilt.push(table);
  }

  return rebuilt;
}
