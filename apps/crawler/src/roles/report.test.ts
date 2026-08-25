import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { describeDrain, describeStatus, describeUnit } from "./report.ts";

describe("report", () => {
  test("a backfill unit reads as a range with its counts", async () => {
    const line = describeUnit(
      { kind: "backfill", from: 1_000, to: 1_049 },
      "ok",
      { ok: 48, gap: 1, error: 1, skipped: 0, unchanged: 0 },
      95_000,
    );
    assert.equal(line, "ids 1,000..1,049: 48 crawled, 1 absent upstream, 1 FAILED [1m35s]");
  });

  test("a refresh that found nothing changed says so", async () => {
    const line = describeUnit(
      { kind: "refresh", ids: [1, 2, 3] },
      "ok",
      { ok: 0, gap: 0, error: 0, skipped: 0, unchanged: 3 },
      4_000,
    );
    assert.equal(line, "refresh 3 due id(s): 0 crawled, 3 unchanged [4.0s]");
  });

  test("a failed unit names the work and the error", async () => {
    const line = describeUnit(
      { kind: "refresh", ids: [7] },
      "error",
      "circuit breaker is open",
      1_200,
    );
    assert.match(String(line), /refresh of 1 id\(s\) failed after 1.2s: circuit breaker is open/);
  });

  test("a steady-state drain logs nothing", () => {
    assert.equal(
      describeDrain("meili", { pushed: 0, batches: 0, remaining: 0 }),
      null,
      "an empty outbox every two seconds is not news",
    );
  });

  test("a drain that moved documents reports progress and quarantines", () => {
    const line = describeDrain("meili", {
      pushed: 10_000, batches: 1, remaining: 90_000, quarantined: 2,
    });
    assert.equal(line, "meili: indexed 10,000 in 1 batch(es), 90,000 left, 2 QUARANTINED");
  });

  test("the status line surfaces what is wrong, not just what is running", () => {
    const line = describeStatus(
      {
        crawl: { backfillCursor: 500_000, maxThesisId: 1_030_000, backfillPercent: 48.54, idsDueForRecheck: 12 },
        pendingProjection: { meili: 100_000, clickhouse: 0, meiliQuarantined: 3 },
        upstream: { breaker: "open", consecutiveFailures: 7 },
        reconciliation: { yearsShort: 2, missingRecords: 40 },
        search: { databaseSizeBytes: 2 * 1024 ** 3, indexedTheses: 400_000 },
      },
      312,
    );
    assert.match(line, /backfill 500,000\/1,030,000 \(48.54%\)/);
    assert.match(line, /312 ids\/min/);
    assert.match(line, /outbox meili 100,000/);
    assert.match(line, /meili 400,000 indexed, 2.0GB on disk/);
    assert.match(line, /3 QUARANTINED DOCS/);
    assert.match(line, /breaker open after 7 failures/);
    assert.match(line, /40 records short of YÖK/);
  });
});
