/**
 * Versioned, additive migrations.
 *
 * Three deliberate departures from the previous schema, each fixing a live bug:
 *
 *  1. `theses` is ReplacingMergeTree(version), not plain MergeTree. The old table had no
 *     dedup, so re-running a push duplicated every row and silently inflated every count
 *     and materialised view.
 *  2. No DROP TABLE anywhere on a data path. `create-schema.ts` dropped `universities`
 *     and `subject_stats` on every push, while /universities and /subjects were serving
 *     reads from exactly those tables.
 *  3. Aggregates are built into a shadow table and swapped in atomically (see
 *     rebuildAggregates), rather than dropped and repopulated in place.
 */
export type Migration = { id: string; sql: string };

export const MIGRATIONS: Migration[] = [
  {
    id: "0001_theses",
    sql: `
      CREATE TABLE IF NOT EXISTS theses (
        id UInt32,
        author String,
        university String,
        institute String,
        year UInt32,
        thesis_type String,
        language String,
        page_count Nullable(UInt32),
        department Nullable(String),
        branch Nullable(String),
        restricted UInt8 DEFAULT 0,
        version UInt64 DEFAULT toUnixTimestamp64Milli(now64(3))
      ) ENGINE = ReplacingMergeTree(version)
      ORDER BY id`,
  },
  {
    id: "0002_dimensions",
    sql: `
      CREATE TABLE IF NOT EXISTS subjects (
        name String, language String,
        version UInt64 DEFAULT toUnixTimestamp64Milli(now64(3))
      ) ENGINE = ReplacingMergeTree(version) ORDER BY (name, language)`,
  },
  {
    id: "0003_keywords",
    sql: `
      CREATE TABLE IF NOT EXISTS keywords (
        name String, language String,
        version UInt64 DEFAULT toUnixTimestamp64Milli(now64(3))
      ) ENGINE = ReplacingMergeTree(version) ORDER BY (name, language)`,
  },
  {
    id: "0004_advisors",
    sql: `
      CREATE TABLE IF NOT EXISTS advisors (
        name String,
        version UInt64 DEFAULT toUnixTimestamp64Milli(now64(3))
      ) ENGINE = ReplacingMergeTree(version) ORDER BY name`,
  },
  {
    id: "0005_thesis_subjects",
    sql: `
      CREATE TABLE IF NOT EXISTS thesis_subjects (
        thesis_id UInt32, subject_name String,
        version UInt64 DEFAULT toUnixTimestamp64Milli(now64(3))
      ) ENGINE = ReplacingMergeTree(version) ORDER BY (thesis_id, subject_name)`,
  },
  {
    id: "0006_thesis_keywords",
    sql: `
      CREATE TABLE IF NOT EXISTS thesis_keywords (
        thesis_id UInt32, keyword_name String,
        version UInt64 DEFAULT toUnixTimestamp64Milli(now64(3))
      ) ENGINE = ReplacingMergeTree(version) ORDER BY (thesis_id, keyword_name)`,
  },
  {
    id: "0007_thesis_advisors",
    sql: `
      CREATE TABLE IF NOT EXISTS thesis_advisors (
        thesis_id UInt32, advisor_name String,
        version UInt64 DEFAULT toUnixTimestamp64Milli(now64(3))
      ) ENGINE = ReplacingMergeTree(version) ORDER BY (thesis_id, advisor_name)`,
  },
  {
    // Aggregates the web app reads. Plain tables, rebuilt and swapped — not
    // materialised views with POPULATE, which cannot be rebuilt without a drop.
    id: "0008_universities",
    sql: `
      CREATE TABLE IF NOT EXISTS universities (
        name String,
        thesis_count UInt64, language_count UInt64, author_count UInt64,
        thesis_type_count UInt64, institute_count UInt64, department_count UInt64,
        branch_count UInt64,
        keyword_count_turkish UInt64, subject_count_turkish UInt64,
        keyword_count_english UInt64, subject_count_english UInt64,
        year_start UInt32, year_end UInt32
      ) ENGINE = MergeTree() ORDER BY name`,
  },
  {
    id: "0009_subject_stats",
    sql: `
      CREATE TABLE IF NOT EXISTS subject_stats (
        name String, language String,
        thesis_count UInt64, language_count UInt64, author_count UInt64,
        thesis_type_count UInt64, university_count UInt64, institute_count UInt64,
        department_count UInt64, branch_count UInt64,
        keyword_count_turkish UInt64, keyword_count_english UInt64,
        year_start UInt32, year_end UInt32
      ) ENGINE = MergeTree() ORDER BY (name, language)`,
  },
  {
    id: "0010_thesis_subjects_by_university",
    sql: `
      CREATE TABLE IF NOT EXISTS thesis_subjects_by_university (
        university String, subject_name String, subject_language String, count UInt64
      ) ENGINE = MergeTree() ORDER BY (university, subject_name, subject_language)`,
  },
  {
    // The /universities/[name] and /subjects/[name] pages are prerendered for every
    // university and subject at build time. Reading those stats straight from `theses`
    // means a full scan per page (`theses` is ORDER BY id, so `WHERE university = ...`
    // cannot use the primary key) — and for subjects, a full join against
    // `thesis_subjects` on top. Each of these is keyed by exactly what the page filters
    // on, turning those scans into primary-key lookups.
    id: "0012_page_aggregates",
    sql: `
      CREATE TABLE IF NOT EXISTS theses_by_university_year_type (
        university String, year UInt32, thesis_type String, count UInt64
      ) ENGINE = MergeTree() ORDER BY (university, year, thesis_type)`,
  },
  {
    id: "0013_page_aggregates_university_language",
    sql: `
      CREATE TABLE IF NOT EXISTS theses_by_university_language (
        university String, language String, count UInt64
      ) ENGINE = MergeTree() ORDER BY (university, language)`,
  },
  {
    id: "0014_page_aggregates_subject_year_type",
    sql: `
      CREATE TABLE IF NOT EXISTS theses_by_subject_year_type (
        subject_name String, year UInt32, thesis_type String, count UInt64
      ) ENGINE = MergeTree() ORDER BY (subject_name, year, thesis_type)`,
  },
  {
    id: "0015_page_aggregates_subject_language",
    sql: `
      CREATE TABLE IF NOT EXISTS theses_by_subject_language (
        subject_name String, language String, count UInt64
      ) ENGINE = MergeTree() ORDER BY (subject_name, language)`,
  },
  {
    id: "0011_migrations_log",
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id String, applied_at DateTime DEFAULT now()
      ) ENGINE = MergeTree() ORDER BY id`,
  },
];
