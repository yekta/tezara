import {
  canonicalUniversity, cleanText, extractKeywords, foldTr, normalizeDepartment,
  parseAdvisors, parseLocation, splitAbstractAndKeywords, titleCaseTr,
  type TCrawledThesis,
} from "@tezara/core";
import { classify } from "./classify.ts";
import { baseForm, byTezNo } from "./form.ts";
import { parseList } from "./parse-list.ts";
import { parsePdfFragment } from "./parse-pdf.ts";
import type { DetailPayload } from "./parse-detail.ts";
import type { Session } from "./session.ts";

export type FetchResult =
  | { status: "ok"; thesis: TCrawledThesis }
  | { status: "gap" }
  | { status: "filter-ignored"; rows: number }
  | { status: "detail-failed" }
  | { status: "maintenance" }
  | { status: "error" };

export type Lookups = {
  subjectEnByTr: Map<string, string>;
  universityCanon: Map<string, string>;
};

/** One thesis, three requests: search → detail → pdf. */
export async function fetchThesisById(
  s: Session,
  id: number,
  lookups: Lookups,
): Promise<FetchResult> {
  await s.throttle();
  const html = await (await s.api.post("SearchTez", { form: byTezNo(id) })).text();
  const outcome = classify(html);

  // Maintenance and error pages feed the breaker; "empty" is a legitimate answer.
  await s.settle(outcome.kind !== "maintenance" && outcome.kind !== "error");

  if (outcome.kind === "empty") return { status: "gap" };
  if (outcome.kind === "maintenance") return { status: "maintenance" };
  if (outcome.kind !== "results") return { status: "error" };

  const rows = parseList(html);
  // A TezNo YÖK cannot parse is silently ignored, yielding 2000 unrelated rows.
  if (rows.length !== 1 || rows[0]!.id !== id) {
    return { status: "filter-ignored", rows: rows.length };
  }
  const row = rows[0]!;

  await s.throttle();
  const detailRes = await s.api.get(
    `tezBilgiDetay.jsp?kayitNo=${encodeURIComponent(row.detail_id_1)}` +
    `&tezNo=${encodeURIComponent(row.detail_id_2)}`,
  );
  let detail: DetailPayload;
  try {
    detail = JSON.parse((await detailRes.text()).trim());
    await s.settle(true);
  } catch {
    await s.settle(false);
    return { status: "detail-failed" };
  }

  await s.throttle();
  const pdfFragment = await (await s.api.get(
    `getTezPdf.jsp?kayitNo=${encodeURIComponent(row.detail_id_1)}` +
    `&tezNo=${encodeURIComponent(row.detail_id_2)}`,
  )).text();
  const pdf = parsePdfFragment(pdfFragment);

  const where = parseLocation(detail.yer);
  const [trAbstract, trKeywordLine] = splitAbstractAndKeywords(detail.trOzet ?? "");
  const [enAbstract, enKeywordLine] = splitAbstractAndKeywords(detail.enOzet ?? "");
  const keywords = extractKeywords(trKeywordLine, enKeywordLine, {
    tr: detail.anahtarKelimeTr,
    en: detail.anahtarKelimeEn,
  });

  const subjects: TCrawledThesis["subjects"] = [];
  for (const tr of (row.subject_raw ?? "").split(";").map((x) => x.trim()).filter(Boolean)) {
    subjects.push({ name: tr, language: "Turkish" });
    const en = lookups.subjectEnByTr.get(foldTr(tr));
    if (en) subjects.push({ name: en, language: "English" });
  }

  return {
    status: "ok",
    thesis: {
      id: row.id,
      title_original: cleanText(row.title_original),
      title_translated: cleanText(row.title_translated) || null,
      author: cleanText(row.author),
      advisors: parseAdvisors(detail.danisman),
      university: canonicalUniversity(where.university, lookups.universityCanon)!,
      institute: titleCaseTr(where.institute)!,
      department: normalizeDepartment(where.department),
      branch: normalizeDepartment(where.branch),
      detail_id_1: row.detail_id_1,
      detail_id_2: row.detail_id_2,
      year: row.year!,
      thesis_type: row.thesis_type!,
      language: row.language!,
      subjects,
      keywords: [
        ...keywords.turkish.map((name) => ({ name, language: "Turkish" as const })),
        ...keywords.english.map((name) => ({ name, language: "English" as const })),
      ],
      abstract_original: cleanText(trAbstract) || null,
      abstract_translated: cleanText(enAbstract) || null,
      page_count: null, // YÖK no longer exposes it
      pdf_url: pdf.pdf_url,
      restricted: pdf.restricted,
    },
  };
}


/**
 * How many theses YÖK reports for a single year.
 *
 * The reconciliation oracle. A year-only search costs one request and returns an
 * authoritative total, which is what makes drift detectable: if YÖK says 66,114 for 2023
 * and we hold 66,090, something was missed.
 *
 * `Durum=0` is load-bearing here as everywhere — the form's default of 3 hides 11.7% of
 * the corpus, so reconciling against it would compare our data to the wrong number.
 */
export async function fetchYearCount(
  s: Session,
  year: number,
): Promise<{ status: "ok"; count: number } | { status: "error" | "maintenance" }> {
  await s.throttle();
  const form = baseForm({ yil1: String(year), yil2: String(year) });
  const html = await (await s.api.post("SearchTez", { form })).text();
  const outcome = classify(html);

  await s.settle(outcome.kind !== "maintenance" && outcome.kind !== "error");

  if (outcome.kind === "maintenance") return { status: "maintenance" };
  if (outcome.kind === "empty") return { status: "ok", count: 0 };
  if (outcome.kind === "error") return { status: "error" };
  // `truncated` still carries the true total — YÖK reports found and shown separately.
  return { status: "ok", count: outcome.found };
}
