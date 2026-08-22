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
    derive: (t) => t.subjects.map(({ name, language }) => ({ id: md5(name), name, language })),
  },
};

export const INDEX_NAMES = Object.keys(INDEXES) as IndexName[];
