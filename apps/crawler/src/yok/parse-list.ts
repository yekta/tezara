import * as cheerio from "cheerio";

export type ListRow = {
  id: number;
  detail_id_1: string;
  detail_id_2: string;
  title_original: string | null;
  title_translated: string | null;
  author: string | null;
  year: number | null;
  thesis_type: string | null;
  language: string | null;
  subject_raw: string | null;
};

type RefMeta = {
  author?: string; year?: string; subject?: string;
  type?: string; lang?: string; yer?: string; title?: string;
};

function balancedObject(src: string, start: number): string | null {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(start, i + 1);
  }
  return null;
}

/**
 * The per-row metadata lives in a JS object literal on the page.
 * Two traps, both of which silently null out every metadata field:
 *  1. Anchor on the ASSIGNMENT — the identifier appears 13x inside function bodies first.
 *  2. YÖK emits trailing commas: valid JS, invalid JSON. Strip them before parsing.
 */
export function parseReferenceData(html: string): Record<string, { meta?: RefMeta }> {
  const m = /referenceData\s*=\s*\{/.exec(html);
  if (!m) return {};
  const blob = balancedObject(html, html.indexOf("{", m.index));
  if (!blob) return {};
  try {
    return JSON.parse(blob.replace(/,(\s*[}\]])/g, "$1"));
  } catch {
    return {};
  }
}

export function parseList(html: string): ListRow[] {
  const $ = cheerio.load(html);
  const ref = parseReferenceData(html);
  const rows: ListRow[] = [];

  $(".result-card").each((_, el) => {
    const $c = $(el);
    const meta = ref[$c.attr("data-index") ?? ""]?.meta ?? {};
    const tezNo = /Tez No:\s*(\d+)/.exec($c.text())?.[1];
    const k1 = $c.attr("data-kayitno");
    const k2 = $c.attr("data-tezno");
    if (!tezNo || !k1 || !k2) return;

    rows.push({
      id: Number(tezNo),
      detail_id_1: k1,
      detail_id_2: k2,
      title_original: $c.find(".card-title").first().text().trim() || meta.title || null,
      title_translated: $c.find('.card-info[style*="italic"]').first().text().trim() || null,
      author: meta.author ?? null,
      year: meta.year ? Number(meta.year) : null,
      thesis_type: meta.type ?? null,
      language: meta.lang ?? null,
      subject_raw: meta.subject ?? null,
    });
  });

  return rows;
}
