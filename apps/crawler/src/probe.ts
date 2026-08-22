/**
 * Phase 1 smoke test: fetch one thesis end to end and print it.
 *   pnpm --filter @tezara/crawler probe 109
 */
import { fetchThesisById } from "./yok/client.ts";
import { openSession } from "./yok/session.ts";
import { fetchSubjectTaxonomy } from "./yok/taxonomy.ts";
import { foldTr } from "./yok/normalize.ts";

const ids = process.argv.slice(2).map(Number).filter((n) => Number.isInteger(n) && n > 0);
if (ids.length === 0) {
  console.error("usage: probe <tezNo> [tezNo...]");
  process.exit(1);
}

const session = await openSession({ delayMs: 400 });
try {
  const subjects = await fetchSubjectTaxonomy(session);
  console.error(`subject taxonomy: ${subjects.length} paired entries`);
  const lookups = {
    subjectEnByTr: new Map(subjects.map((s) => [foldTr(s.tr), s.en])),
    universityCanon: new Map<string, string>(),
  };

  for (const id of ids) {
    const result = await fetchThesisById(session, id, lookups);
    if (result.status !== "ok") {
      console.log(`${id}: ${result.status}`);
      continue;
    }
    const { abstract_original, abstract_translated, ...rest } = result.thesis;
    console.log(JSON.stringify({
      ...rest,
      abstract_original: abstract_original ? `${abstract_original.slice(0, 90)}…` : null,
      abstract_translated: abstract_translated ? `${abstract_translated.slice(0, 90)}…` : null,
    }, null, 2));
  }
} finally {
  await session.close();
}
