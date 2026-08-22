export type SearchOutcome =
  | { kind: "results"; found: number; shown: number }
  | { kind: "truncated"; found: number; shown: number }
  | { kind: "empty"; found: 0; shown: 0 }
  | { kind: "maintenance" }
  | { kind: "error" };

const trNumber = (raw: string) => Number.parseInt(raw.replace(/[.\s]/g, ""), 10);

/**
 * Anchored on the canonical count element. YÖK states both the total and how many it
 * returned — "Arama sonucunda 13.061 kayıt bulundu. 2.000 tanesi görüntülenmektedir."
 * so truncation is read, never inferred.
 *
 * Never scan free text for "kayıt": the word also occurs inside thesis titles, and a
 * naive /([\d.,]+)\s*kayıt/ happily matches a bare comma from a title.
 */
export function classify(html: string): SearchOutcome {
  if (/BAKIM CALISMASI|undergoing maintenance/i.test(html)) return { kind: "maintenance" };
  if (/Geçersiz sorgulama|tezSorguSonucHata/i.test(html)) return { kind: "error" };

  const cards = (html.match(/class="result-card/g) ?? []).length;
  const el = /<div class="result-count-text"[^>]*>([\s\S]*?)<\/div>/.exec(html);
  if (!el) return cards === 0 ? { kind: "empty", found: 0, shown: 0 } : { kind: "error" };

  const text = el[1]!.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const found = /([\d.]+)\s*kayıt bulundu/.exec(text);
  if (!found) return cards === 0 ? { kind: "empty", found: 0, shown: 0 } : { kind: "error" };

  const total = trNumber(found[1]!);
  if (!Number.isFinite(total)) return { kind: "error" };
  if (total === 0) return { kind: "empty", found: 0, shown: 0 };

  const displayed = /([\d.]+)\s*tanesi görüntülenmektedir/.exec(text);
  const shown = displayed ? trNumber(displayed[1]!) : cards;
  return shown < total
    ? { kind: "truncated", found: total, shown }
    : { kind: "results", found: total, shown };
}
