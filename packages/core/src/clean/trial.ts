import { foldTr } from "./normalize.ts";

/** Titles universities type in while testing YÖK's system, compared without digits or punctuation. */
export const placeholderTitles = [
  "deneme",
  "deneme tezi",
  "test",
  "test tezi",
  "daha sonra doldurulacaktır",
] as const;

const PLACEHOLDER_TITLES = new Set<string>(placeholderTitles);

const yearFormat = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", year: "numeric" });

export function currentYear(now: Date = new Date()): number {
  return Number(yearFormat.format(now));
}

const titleKey = (title: string) => foldTr(title).replace(/[^\p{L}]+/gu, " ").trim();

/** A record YÖK serves that is not a real thesis: a future year or a placeholder title. */
export function isTrialThesis(
  thesis: { title_original: string; year: number | null },
  now: Date = new Date(),
): boolean {
  if (thesis.year !== null && thesis.year > currentYear(now)) return true;
  return PLACEHOLDER_TITLES.has(titleKey(thesis.title_original));
}
