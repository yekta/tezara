import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { extractKeywords } from "./keywords.ts";

/**
 * Golden fixtures captured from live YÖK detail payloads, with the expected output
 * pinned at the point where this pipeline reached parity with the production corpus
 * (94.9% exact match over 296 records, with every remaining difference being a record
 * where production has no keywords and we recover them).
 *
 * If one of these changes, keyword extraction has drifted — re-measure against
 * production before accepting the new output.
 */
type Fixture = {
  id: number;
  tr: string | null;
  en: string | null;
  expected: { turkish: string[]; english: string[] };
};

const fixtures: Fixture[] = JSON.parse(
  readFileSync(new URL("./__fixtures__.json", import.meta.url), "utf8"),
);

test("golden fixtures are present", () => {
  assert.ok(fixtures.length >= 4, "expected at least 4 captured fixtures");
});

for (const fixture of fixtures) {
  test(`thesis ${fixture.id} keywords are stable`, () => {
    assert.deepEqual(extractKeywords(fixture.tr, fixture.en), fixture.expected);
  });
}

test("the comma split runs before cleanKeywords", () => {
  // Regression guard: feeding the raw line straight into cleanKeywords leaves
  // "a, b, c" as one entry and drops parity from ~90% to ~71%.
  const out = extractKeywords("Bel ağrısı, Dalış, Dizabilite", null);
  assert.deepEqual(out.turkish, ["Bel ağrısı", "Dalış", "Dizabilite"]);
});
