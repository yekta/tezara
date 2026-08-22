import { CHARACTER_FIXES, TRUNCATE_AFTER_MARKERS } from "./markers.ts";
import { KEYWORD_TRIM_CHARS, trimChars } from "./text.ts";

const MAX_KEYWORD_LENGTH = 90;
const MIN_KEYWORD_LENGTH = 3;

/** Drop everything from the first occurrence of `word` onward, across the whole list. */
function truncateAt(items: string[], word: string): string[] {
  const index = items.findIndex((k) => k.includes(word));
  if (index === -1) return items;
  const cut = items[index]!.slice(0, items[index]!.indexOf(word));
  return [...items.slice(0, index), cut];
}

/** Parse "1. foo 2. bar 3. baz" (or `)`, `-`, `(n)` variants) into a list. */
function parseNumberedList(input: string): string[] {
  if (!/^(?:1[.)\-]|\(1\))/.test(input)) return [input];
  const re = /(?:\d+[.)\-]|\(\d+\))\s*([^\d.)\-(]+?)(?=\s*(?:\d+[.)\-]|\(\d+\))|$)/g;
  const matches = [...input.matchAll(re)].map((m) => m[1]!.trim());
  return matches.length ? matches : [];
}

const containsAll = (items: string[], needles: string[]) =>
  needles.every((n) => items.join(" ").includes(n));

/**
 * Normalise a raw keyword line into discrete keywords.
 *
 * Faithful port of the previous pipeline's `cleanKeywords`, whose behaviour the live
 * corpus already reflects — the ordering of these steps is load-bearing and changing it
 * silently changes what lands in the index.
 */
export function cleanKeywords(keywords: readonly string[]): string[] {
  let items = [...keywords];

  for (const marker of TRUNCATE_AFTER_MARKERS) items = truncateAt(items, marker);

  items = items.flatMap((item) => item.split(";"));

  const numbered =
    containsAll(items, ["1.", "2.", "3."]) ||
    containsAll(items, ["1)", "2)", "3)"]) ||
    containsAll(items, ["(1)", "(2)", "(3)"]) ||
    containsAll(items, ["1-", "2-", "3-"]);
  if (numbered) items = parseNumberedList(items.join(" "));

  // An over-long entry means the split failed and we are looking at prose, not a
  // keyword — drop it and everything after it.
  const runaway = items.findIndex((k) => k.length > MAX_KEYWORD_LENGTH);
  if (runaway !== -1) items = items.slice(0, runaway);

  items = items.map((item) => {
    let out = item;
    for (const { from, to } of CHARACTER_FIXES) out = out.replaceAll(from, to);
    return out;
  });

  return items
    .map((s) => s.trim())
    .map((s) => (s.endsWith(".") ? s.slice(0, -1) : s))
    .map((s) => s.trim())
    .filter(Boolean);
}

const INLINE_LABELS = [
  "Anahtar Kelimeler:", "Anahtar kelimeler:", "Anahtar sözcükler:",
  "Anahtar Ek Kelimeler:", "Kelimeler:",
] as const;

/** Split entries that still carry an inline "Anahtar Kelimeler:" label. */
export function splitInlineLabels(input: readonly string[]): string[] {
  let items = [...input];
  for (const label of INLINE_LABELS) {
    items = items.flatMap((item) => {
      const parts = item.split(label).map((p) => p.trim());
      return parts.length > 1 ? parts : [item];
    });
  }
  return items.filter(Boolean);
}

/**
 * Some records put both languages on the Turkish line: "elma, armut Keywords: apple,
 * pear". Split them back apart at the English label.
 */
export function partitionAtEnglishLabel(input: readonly string[]): {
  before: string[];
  after: string[];
} {
  for (const label of ["Keywords:", "Key Words:"]) {
    const before: string[] = [];
    const after: string[] = [];
    let found = false;
    for (const item of input) {
      if (found) {
        after.push(item.trim());
      } else if (item.includes(label)) {
        const at = item.indexOf(label);
        const head = item.slice(0, at).trim();
        const tail = item.slice(at + label.length).trim();
        if (head) before.push(head);
        if (tail) after.push(tail);
        found = true;
      } else {
        before.push(item.trim());
      }
    }
    if (before.length > 0 && after.length > 0) return { before, after };
  }
  return { before: [...input], after: [] };
}

/** Final pass: strip decorative characters and drop anything too short to be a keyword. */
export function finalizeKeywords(items: readonly string[]): string[] {
  return items
    .map((k) => trimChars(k, KEYWORD_TRIM_CHARS))
    .filter((k) => k.length >= MIN_KEYWORD_LENGTH);
}

/**
 * Parse the structured keyword field: "Tr = En ; Tr2 = En2", wrapped in a
 * "<strong>Anahtar Kelime: </strong>" (or "Keyword: ") label.
 *
 * YÖK stores keywords in two different places and a thesis may use either:
 *  - this field, as explicit Turkish/English pairs;
 *  - or appended to the abstract after "Anahtar Kelimeler:", as free text.
 * Reading only the abstract misses every record that uses the structured field.
 */
export function parseKeywordPairs(raw: string | null | undefined): {
  turkish: string[];
  english: string[];
} {
  const text = (raw ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/^\s*(Anahtar Kelime|Keyword)\s*:\s*/i, "");
  const turkish: string[] = [];
  const english: string[] = [];
  for (const pair of text.split(";").map((x) => x.trim()).filter(Boolean)) {
    const [tr, en] = pair.split("=").map((x) => x.trim());
    if (tr) turkish.push(tr);
    if (en) english.push(en);
  }
  return { turkish, english };
}

const dedupe = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((k) => {
    const key = k.toLocaleLowerCase("tr-TR");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Full keyword pipeline for one thesis, mirroring the order the previous pipeline used.
 *
 * The comma split has to happen FIRST and is easy to miss: the old code did it in
 * extend-json.ts, so `cleanKeywords` only ever saw an already-split array. Feeding it
 * the raw line instead drops keyword parity from ~90% to ~71%, because the semicolon
 * split alone leaves "a, b, c" as a single entry.
 *
 * Returns both languages because the Turkish line sometimes carries the English one.
 */
export function extractKeywords(
  turkishRaw: string | null,
  englishRaw: string | null,
  /** The structured `anahtarKelimeTr` / `anahtarKelimeEn` fields, if present. */
  pairsRaw?: { tr?: string | null; en?: string | null },
): {
  turkish: string[];
  english: string[];
} {
  const commaSplit = (line: string | null) =>
    (line ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  let turkish = turkishRaw ? cleanKeywords(commaSplit(turkishRaw)) : [];
  let english = englishRaw ? cleanKeywords(commaSplit(englishRaw)) : [];

  if (turkish.length) {
    turkish = splitInlineLabels(turkish);
    const { before, after } = partitionAtEnglishLabel(turkish);
    if (before.length > 0 && after.length > 0) {
      turkish = before;
      if (english.length === 0) english = after;
    }
  }

  // The structured field is a second, independent source — merge rather than replace, so
  // a thesis that populates both keeps everything.
  const a = parseKeywordPairs(pairsRaw?.tr);
  const b = parseKeywordPairs(pairsRaw?.en);

  return {
    turkish: dedupe([
      ...finalizeKeywords(turkish),
      ...finalizeKeywords(a.turkish),
      ...finalizeKeywords(b.turkish),
    ]),
    english: dedupe([
      ...finalizeKeywords(english),
      ...finalizeKeywords(a.english),
      ...finalizeKeywords(b.english),
    ]),
  };
}
