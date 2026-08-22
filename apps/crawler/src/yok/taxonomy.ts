import type { Session } from "./session.ts";

export type SubjectPair = { tr: string; en: string; kod: string };

/**
 * The new list API exposes only the Turkish subject name, so the English half looked
 * lost. It isn't: tarama.jsp embeds the full paired taxonomy —
 *   <input ad="Acil Tıp" value="Acil Tıp = Emergency Medicine" kod="192">
 * 194 subjects, all paired, with stable integer codes (unlike university tokens).
 */
export async function fetchSubjectTaxonomy(s: Session): Promise<SubjectPair[]> {
  await s.throttle();
  const html = await (await s.api.get("tarama.jsp")).text();
  const start = html.indexOf("konu-items-container");
  if (start === -1) throw new Error("subject picker not found — YÖK markup changed");

  const out: SubjectPair[] = [];
  const re = /<input[^>]*ad="([^"]*)"[^>]*value="([^"]*)"[^>]*kod="(\d+)"/g;
  for (const m of html.slice(start).matchAll(re)) {
    const en = m[2]!.split("=")[1]?.trim();
    if (en) out.push({ tr: m[1]!, en, kod: m[3]! });
  }
  if (out.length === 0) throw new Error("subject taxonomy empty — YÖK markup changed");
  return out;
}
