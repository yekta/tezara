import assert from "node:assert/strict";
import { test } from "node:test";
import { parseBlockedTheses } from "./blocked-theses.ts";

test("parses a comma-separated id list, ignoring whitespace and junk", () => {
  assert.deepEqual(
    [...parseBlockedTheses(" 12, 34 ,,abc, 0, -5, 3.5, 34, 56\n")],
    [12, 34, 56],
  );
});

test("empty or unset is an empty set", () => {
  assert.equal(parseBlockedTheses(undefined).size, 0);
  assert.equal(parseBlockedTheses("").size, 0);
  assert.equal(parseBlockedTheses(" , ").size, 0);
});
