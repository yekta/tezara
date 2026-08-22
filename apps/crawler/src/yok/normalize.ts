/** Turkish-aware casing. Old YÖK returned title case; the new API returns UPPERCASE. */
const trLower = (s: string) => s.replace(/İ/g, "i").replace(/I/g, "ı").toLocaleLowerCase("tr-TR");
const trUpperFirst = (c: string) => (c === "i" ? "İ" : c === "ı" ? "I" : c.toLocaleUpperCase("tr-TR"));

const LOWERCASE_WORDS = new Set(["ve", "ile", "için", "ya", "veya", "da", "de", "ki", "mi"]);

export const foldTr = trLower;

export function titleCaseTr(s: string | null): string | null {
  if (!s) return s;
  return trLower(s)
    .split(/(\s+)/)
    .map((word, i) => {
      if (!word.trim()) return word;
      if (i > 0 && LOWERCASE_WORDS.has(word)) return word;
      return word.split("-").map((p) => (p ? trUpperFirst(p[0]!) + p.slice(1) : p)).join("-");
    })
    .join("");
}

/** Old YÖK wrote "Ana Bilim Dalı"; the new API writes "ANABİLİM DALI". */
export function normalizeDepartment(s: string | null): string | null {
  const t = titleCaseTr(s);
  return t ? t.replace(/\bAnabilim\b/g, "Ana Bilim").replace(/\bAnasanat\b/g, "Ana Sanat") : t;
}

/**
 * Universities are a closed set and production keeps acronyms uppercase
 * ("MEF ÜNİVERSİTESİ"), which title-casing would mangle. Resolve against the known
 * corpus first and only fall back to casing rules.
 */
export function canonicalUniversity(raw: string | null, canon: Map<string, string>): string | null {
  if (!raw) return null;
  return canon.get(foldTr(raw)) ?? titleCaseTr(raw);
}
