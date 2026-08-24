import { createHash } from "node:crypto";
import type { TCrawledThesis } from "@tezara/core";

export const md5 = (value: string) => createHash("md5").update(value).digest("hex");

export type IndexName =
  | "theses" | "authors" | "advisors" | "universities" | "languages"
  | "thesis_types" | "institutes" | "departments" | "branches"
  | "subjects" | "keywords";

export type IndexDoc = Record<string, unknown> & { id: number | string };

export type IndexDefinition = {
  /** Settings are declarative and applied by a migration step, never on every push. */
  filterable?: string[];
  sortable?: string[];
  maxTotalHits: number;
  batchSize: number;
  /**
   * This index's document set is small, and the same documents recur in batch after
   * batch — so once a name has been pushed it never needs pushing again.
   *
   * Two things have to hold. The document must be fully determined by its id (these are
   * `{ id: md5(name), name }`, so re-pushing cannot change anything), which is what makes
   * skipping safe. And the set must be bounded and recurring — ~210 universities, five
   * languages, four thesis types, a fixed subject taxonomy — which is what makes it
   * worth spending memory to remember ids. See the `known` option in sync.ts.
   *
   * Not set on `theses` (a re-crawl carries new content), nor on `authors`, `advisors`
   * or `keywords`: those grow with the corpus, so remembering their ids would cost more
   * Redis than the pushes it saves.
   */
  saturates?: boolean;
  /** Derive this index's documents from one thesis. */
  derive: (thesis: TCrawledThesis) => IndexDoc | IndexDoc[] | null;
};

/** A dimension index: one document per distinct name. */
const nameIndex = (
  pick: (t: TCrawledThesis) => string | null,
): IndexDefinition => ({
  maxTotalHits: 5_000,
  sortable: ["name"],
  filterable: ["name"],
  batchSize: 20_000,
  saturates: true,
  derive: (t) => {
    const name = pick(t);
    return name ? { id: md5(name), name } : null;
  },
});

export const INDEXES: Record<IndexName, IndexDefinition> = {
  theses: {
    maxTotalHits: 1_500_000,
    filterable: [
      "year", "thesis_type", "university", "institute", "department", "branch",
      "language", "advisors", "author",
      "keywords", "keywords.name", "keywords.language",
      "subjects", "subjects.name", "subjects.language",
    ],
    sortable: ["id", "year"],
    batchSize: 2_000,
    derive: (t) => t as unknown as IndexDoc,
  },
  universities: nameIndex((t) => t.university),
  institutes: nameIndex((t) => t.institute),
  departments: nameIndex((t) => t.department),
  branches: nameIndex((t) => t.branch),
  languages: nameIndex((t) => t.language),
  thesis_types: nameIndex((t) => t.thesis_type),
  authors: {
    ...nameIndex((t) => t.author),
    maxTotalHits: 5_000,
    // One new author per thesis, near enough: the id set grows with the corpus, so
    // caching it would cost ~80MB of non-evictable Redis to skip almost nothing.
    saturates: false,
  },
  advisors: {
    maxTotalHits: 5_000,
    sortable: ["name"],
    filterable: ["name"],
    batchSize: 20_000,
    derive: (t) => t.advisors.map((name) => ({ id: md5(name), name })),
  },
  keywords: {
    maxTotalHits: 5_000,
    sortable: ["name", "language"],
    filterable: ["name", "language"],
    batchSize: 20_000,
    derive: (t) => t.keywords.map(({ name, language }) => ({ id: md5(name), name, language })),
  },
  subjects: {
    maxTotalHits: 5_000,
    sortable: ["name", "language"],
    filterable: ["name", "language"],
    batchSize: 20_000,
    saturates: true,
    derive: (t) => t.subjects.map(({ name, language }) => ({ id: md5(name), name, language })),
  },
};

export const INDEX_NAMES = Object.keys(INDEXES) as IndexName[];
