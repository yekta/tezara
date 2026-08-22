import type { TCrawledThesis } from "@tezara/core";
import type { ClickHouseClient } from "./client.ts";

/**
 * Project a batch of theses into ClickHouse.
 *
 * Idempotent: every table is ReplacingMergeTree keyed on the natural key, so re-inserting
 * the same thesis replaces rather than duplicates. The old pipeline's plain MergeTree
 * meant a second push silently doubled every count.
 *
 * Note that ReplacingMergeTree dedups at merge time, so reads must use FINAL (or
 * argMax) to be exact immediately after a write — which the aggregate rebuild does.
 */
export async function syncTheses(
  client: ClickHouseClient,
  theses: readonly TCrawledThesis[],
): Promise<{ theses: number; subjects: number; keywords: number; advisors: number }> {
  if (theses.length === 0) return { theses: 0, subjects: 0, keywords: 0, advisors: 0 };

  const version = Date.now();

  await client.insert({
    table: "theses",
    format: "JSONEachRow",
    values: theses.map((t) => ({
      id: t.id,
      author: t.author,
      university: t.university,
      institute: t.institute,
      year: t.year,
      thesis_type: t.thesis_type,
      language: t.language,
      page_count: t.page_count,
      department: t.department,
      branch: t.branch,
      restricted: t.restricted ? 1 : 0,
      version,
    })),
  });

  const subjects = new Map<string, { name: string; language: string; version: number }>();
  const keywords = new Map<string, { name: string; language: string; version: number }>();
  const advisors = new Map<string, { name: string; version: number }>();
  const thesisSubjects: { thesis_id: number; subject_name: string; version: number }[] = [];
  const thesisKeywords: { thesis_id: number; keyword_name: string; version: number }[] = [];
  const thesisAdvisors: { thesis_id: number; advisor_name: string; version: number }[] = [];

  for (const t of theses) {
    for (const s of t.subjects) {
      subjects.set(`${s.name}|${s.language}`, { name: s.name, language: s.language, version });
      thesisSubjects.push({ thesis_id: t.id, subject_name: s.name, version });
    }
    for (const k of t.keywords) {
      keywords.set(`${k.name}|${k.language}`, { name: k.name, language: k.language, version });
      thesisKeywords.push({ thesis_id: t.id, keyword_name: k.name, version });
    }
    for (const a of t.advisors) {
      advisors.set(a, { name: a, version });
      thesisAdvisors.push({ thesis_id: t.id, advisor_name: a, version });
    }
  }

  const insert = async (table: string, values: unknown[]) => {
    if (values.length > 0) await client.insert({ table, values, format: "JSONEachRow" });
  };

  await insert("subjects", [...subjects.values()]);
  await insert("keywords", [...keywords.values()]);
  await insert("advisors", [...advisors.values()]);
  await insert("thesis_subjects", thesisSubjects);
  await insert("thesis_keywords", thesisKeywords);
  await insert("thesis_advisors", thesisAdvisors);

  return {
    theses: theses.length,
    subjects: subjects.size,
    keywords: keywords.size,
    advisors: advisors.size,
  };
}
