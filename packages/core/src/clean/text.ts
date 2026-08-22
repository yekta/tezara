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

const ABSTRACT_KEYWORD_MARKERS = [
  "Anahtar Kelimeler:", "Anahtar kelimeler:", "Anahtar Sözcükler:", "Anahtar sözcükler:",
  "Keywords:", "Key Words:", "Key words:", "Anahtar kavramlar:", "Key terms:",
] as const;

/**
 * YÖK returns the abstract with its keyword line appended. Splitting here is what keeps
 * the two apart — roughly 90% of the abstracts in the current corpus have the English
 * abstract concatenated onto the Turkish one because the old pipeline never did this.
 */
export function splitAbstractAndKeywords(text: string): [string, string | null] {
  if (!text) return ["", null];
  let at = -1;
  let marker = "";
  for (const m of ABSTRACT_KEYWORD_MARKERS) {
    const p = text.indexOf(m);
    if (p !== -1 && (at === -1 || p < at)) {
      at = p;
      marker = m;
    }
  }
  if (at === -1) return [text.trim(), null];
  const tail = text
    .slice(at + marker.length)
    .trim()
    .replace(/^[:\s,]+/, "")
    .replace(/[\s,]+$/, "");
  return [text.slice(0, at).trim(), tail];
}
