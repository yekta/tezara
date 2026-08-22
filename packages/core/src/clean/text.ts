/** Collapse whitespace and normalise straight quotes to typographic ones. */
export function cleanText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/[\r\n\t\f\v]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s?"([^"]*)"\s?/g, "“$1”")
    .trim();
}

/** Strip any of `chars` repeatedly from both ends. */
export function trimChars(input: string, chars: readonly string[]): string {
  const escaped = chars
    .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  return input.replace(new RegExp(`^(?:${escaped})+|(?:${escaped})+$`, "g"), "");
}

export const KEYWORD_TRIM_CHARS = ['"', "'", "-", "!", "^", "?", "“", " "] as const;

/**
 * Turkish-safe case folding that preserves string length.
 *
 * `"İ".toLowerCase()` yields two code points, which would shift every index after it —
 * so the dotted capital is mapped explicitly before folding.
 */
const foldForSearch = (s: string) => s.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase();

/**
 * Matches every keyword label seen in the corpus, in either language.
 *
 * A fixed list of strings does not survive contact with this data: authors write
 * "Anahtar Kelimeler:", "Anahtar kelime:", "ANAHTAR KELİMELER:", "Anahtar Sözcükler:",
 * "Keywords :", "KEY WORDS:" and more. Singular/plural, casing, and the space before the
 * colon all vary, so this matches the shape instead of enumerating spellings.
 */
const KEYWORD_LABEL =
  /(?:anahtar\s*(?:kelimeler|kelime|sözcükler|sözcük|kavramlar|kavram|ek\s*kelimeler)|key\s*words?|keywords?|key\s*terms?)\s*:/;

export function splitAbstractAndKeywords(text: string): [string, string | null] {
  if (!text) return ["", null];
  // Search a folded copy of identical length, then slice the ORIGINAL so casing survives.
  const match = KEYWORD_LABEL.exec(foldForSearch(text));
  if (!match) return [text.trim(), null];

  const at = match.index;
  const tail = text
    .slice(at + match[0].length)
    .trim()
    .replace(/^[:\s,]+/, "")
    .replace(/[\s,]+$/, "");
  return [text.slice(0, at).trim(), tail];
}
