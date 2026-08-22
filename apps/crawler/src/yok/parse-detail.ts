export type DetailPayload = {
  danisman?: string;
  yer?: string;
  trOzet?: string;
  enOzet?: string;
  anahtarKelimeTr?: string;
  anahtarKelimeEn?: string;
};

export const stripTags = (v: string | undefined | null) =>
  (v ?? "").replace(/<[^>]*>/g, "").trim();

export const cleanText = (v: string | undefined | null) =>
  !v ? "" : v.replace(/[\r\n\t\f\v]/g, " ").replace(/\s+/g, " ")
             .replace(/\s?"([^"]*)"\s?/g, "“$1”").trim();

const KEYWORD_MARKERS = [
  "Anahtar Kelimeler:", "Anahtar kelimeler:", "Anahtar Sözcükler:", "Anahtar sözcükler:",
  "Keywords:", "Key Words:", "Key words:", "Anahtar kavramlar:", "Key terms:",
];

/**
 * Keywords are NOT in `anahtarKelime*` (that field carries the subject pairs). They sit
 * at the tail of the abstract after one of the markers above — the same place the old
 * pipeline found them. Splitting here is also what keeps abstracts clean: ~90% of the
 * current production abstracts have the English abstract concatenated onto the Turkish.
 */
export function splitAbstractAndKeywords(text: string): [string, string | null] {
  if (!text) return ["", null];
  let at = -1;
  let marker = "";
  for (const m of KEYWORD_MARKERS) {
    const p = text.indexOf(m);
    if (p !== -1 && (at === -1 || p < at)) { at = p; marker = m; }
  }
  if (at === -1) return [text.trim(), null];
  const keywords = text.slice(at + marker.length).trim()
    .replace(/^[:\s,]+/, "").replace(/[\s,]+$/, "");
  return [text.slice(0, at).trim(), keywords];
}

export function parseAdvisors(danisman: string | undefined): string[] {
  return stripTags((danisman ?? "").replace(/<strong>.*?<\/strong>/g, ""))
    .split(";")
    .map((a) => cleanText(a))
    .filter(Boolean)
    .filter((a) => !a.includes("Yer Bilgisi:"))
    .map((a) => (a.startsWith("null ") ? a.slice(5).trim() : a));
}

/** `Yer Bilgisi` is a "/"-separated path: university / institute / department / branch. */
export function parseLocation(yer: string | undefined) {
  const p = (yer ?? "").split("/").map((x) => x.trim()).filter(Boolean);
  return {
    university: p[0] ?? null,
    institute: p[1] ?? null,
    department: p[2] ?? null,
    branch: p[3] ?? null,
  };
}
