import { cleanText } from "./text.ts";

export const stripTags = (v: string | null | undefined) =>
  (v ?? "").replace(/<[^>]*>/g, "").trim();

/** `Yer Bilgisi` is a "/"-separated path: university / institute / department / branch. */
export function parseLocation(yer: string | null | undefined) {
  const parts = (yer ?? "").split("/").map((x) => x.trim()).filter(Boolean);
  return {
    university: parts[0] ?? null,
    institute: parts[1] ?? null,
    department: parts[2] ?? null,
    branch: parts[3] ?? null,
  };
}

/**
 * The advisor line arrives as "<strong>Danışman: </strong>PROF. DR. ...", occasionally
 * with several advisors separated by ";". Two contaminants the corpus already contains:
 * a stray "Yer Bilgisi:" fragment, and a literal "null " prefix.
 */
export function parseAdvisors(danisman: string | null | undefined): string[] {
  return stripTags((danisman ?? "").replace(/<strong>.*?<\/strong>/g, ""))
    .split(";")
    .map((a) => cleanText(a))
    .filter(Boolean)
    .filter((a) => !a.includes("Yer Bilgisi:"))
    .map((a) => (a.startsWith("null ") ? a.slice(5).trim() : a));
}
