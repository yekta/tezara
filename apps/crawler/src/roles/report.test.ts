import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Job } from "../queue/queue.ts";
import { describeJob, describeStatus } from "./report.ts";

const job = (kind: Job["kind"], params: Record<string, unknown>, attempts = 0): Job => ({
  id: `${kind}:x`, kind, params, attempts, runAfter: 0,
});

describe("job reporting", () => {
  test("a scan says which ids it walked, not just a count", () => {
    const line = describeJob(
      job("scan-id-range", { from: 812350, to: 812399 }),
      "ok",
      { ok: 48, gap: 2, error: 0, skipped: 0 },
      12_300,
    );
    assert.match(String(line), /ids 812,350\.\.812,399/);
    assert.match(String(line), /48 crawled/);
    assert.match(String(line), /2 absent upstream/);
    assert.doesNotMatch(String(line), /FAILED/, "zero failures are not worth a word");
    assert.match(String(line), /\[12\.3s\]/);
  });

  test("a drain that did nothing gets no line at all", () => {
    const lockHeld = describeJob(
      job("sync-meili", { at: 1 }),
      "ok",
      { pushed: 0, batches: 0, remaining: 15645, skipped: "another worker holds the drain lock" },
      4,
    );
    assert.equal(lockHeld, null, "losing the race is not news — nine lanes do it a minute");

    const nothingQueued = describeJob(
      job("sync-clickhouse", { at: 1 }),
      "ok",
      { pushed: 0, batches: 0, remaining: 0, rebuilt: [] },
      6,
    );
    assert.equal(nothingQueued, null, "an empty outbox is the steady state");

    const didWork = describeJob(
      job("sync-clickhouse", { at: 1 }),
      "ok",
      { pushed: 640, batches: 1, remaining: 4, rebuilt: [] },
      600,
    );
    assert.match(String(didWork), /clickhouse: indexed 640/);
  });

  test("quarantined documents are shouted about, not buried", () => {
    const line = describeJob(
      job("sync-meili", { at: 1 }),
      "ok",
      { pushed: 4000, batches: 4, remaining: 11645, quarantined: 3 },
      200_000,
    );
    assert.match(String(line), /indexed 4,000 in 4 batch\(es\)/);
    assert.match(String(line), /3 QUARANTINED/);
    assert.match(String(line), /\[3m20s\]/);
  });

  test("a retry names the job and how many attempts are left", () => {
    const line = describeJob(job("sync-meili", { at: 9 }, 2), "retry", "boom", 500);
    assert.match(String(line), /retry 3 of sync-meili/);
    assert.match(String(line), /boom/);
  });

  test("a reconciliation reports the shortfall in words", () => {
    const short = describeJob(
      job("reconcile-year", { year: 1967 }),
      "ok",
      { year: 1967, reported: 10, held: 0, drift: 10 },
      2_100,
    );
    assert.match(String(short), /year 1967: YÖK has 10, we hold 0 — missing 10/);

    const done = describeJob(
      job("reconcile-year", { year: 2020 }),
      "ok",
      { year: 2020, reported: 40000, held: 40000, drift: 0 },
      2_100,
    );
    assert.match(String(done), /complete \(40,000 of 40,000\)/);
  });

  test("the status line leads with progress and only mentions trouble when there is some", () => {
    const healthy = describeStatus(
      {
        crawl: { backfillCursor: 812_400, maxThesisId: 1_030_000, backfillPercent: 78.87 },
        queue: { pending: 20, running: 10, dead: 0 },
        pendingProjection: { meili: 0, clickhouse: 3, meiliQuarantined: 0 },
        upstream: { breaker: "closed", consecutiveFailures: 0 },
        reconciliation: { yearsShort: 0, missingRecords: 0 },
        search: { databaseSizeBytes: 3_650_722_201, indexedTheses: 812_000 },
      },
      300,
    );
    assert.match(healthy, /backfill 812,400\/1,030,000 \(78\.87%\)/);
    assert.match(healthy, /300 ids\/min/);
    assert.match(healthy, /meili 812,000 indexed, 3\.4GB on disk/);
    assert.doesNotMatch(healthy, /DEAD|QUARANTINED|breaker/);

    const sick = describeStatus(
      {
        crawl: { backfillCursor: 1, maxThesisId: 1_030_000, backfillPercent: 0 },
        queue: { pending: 0, running: 0, dead: 4 },
        pendingProjection: { meili: 15_645, clickhouse: 0, meiliQuarantined: 7 },
        upstream: { breaker: "open", consecutiveFailures: 5 },
        reconciliation: { yearsShort: 3, missingRecords: 120 },
        search: { unreachable: "No space left on device (os error 28)" },
      },
      0,
    );
    assert.match(sick, /MEILI UNREACHABLE: No space left on device/);
    assert.match(sick, /4 DEAD JOBS \(see \/failures\)/);
    assert.match(sick, /7 QUARANTINED DOCS/);
    assert.match(sick, /breaker open after 5 failures/);
    assert.match(sick, /120 records short of YÖK/);
  });
});
