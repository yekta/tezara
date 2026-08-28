import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { MeiliSearch } from "@tezara/meili";
import { createCompactionPolicy } from "./compact-meili.ts";

/**
 * A stand-in for the two calls the policy makes: `GET /stats` to decide, and
 * `POST /indexes/theses/compact` to act. Nothing else about the client is touched.
 */
function fakeClient(script: { file: number; live: number; documents: number }[]) {
  const compactions: number[] = [];
  let call = 0;
  const client = {
    httpRequest: {
      get: async () => {
        const s = script[Math.min(call++, script.length - 1)]!;
        return {
          databaseSize: s.file,
          usedDatabaseSize: s.live,
          indexes: { theses: { numberOfDocuments: s.documents } },
        };
      },
      post: async () => {
        compactions.push(call);
        return { taskUid: compactions.length };
      },
    },
    waitForTask: async () => ({ status: "succeeded" }),
  } as unknown as MeiliSearch;
  return { client, compactions };
}

const GB = 1e9;

describe("meili compaction policy", () => {
  test("the first drain only anchors the watermark", async () => {
    // Otherwise a crawler that restarts often would compact on every boot.
    const { client, compactions } = fakeClient([{ file: 40 * GB, live: 10 * GB, documents: 500_000 }]);
    const policy = createCompactionPolicy({ client, everyDocs: 100_000, minRatio: 1.4 });
    assert.equal(await policy.afterDrain(), null);
    assert.deepEqual(compactions, []);
  });

  test("compacts once the cadence is reached and the file is fragmented", async () => {
    // Four reads: the policy's own check, then compactIndex's before and after.
    const { client, compactions } = fakeClient([
      { file: 12 * GB, live: 10 * GB, documents: 500_000 }, // anchor
      { file: 20 * GB, live: 10 * GB, documents: 620_000 }, // +120k, ratio 2.0 -> fire
      { file: 20 * GB, live: 10 * GB, documents: 620_000 }, // compactIndex: before
      { file: 11 * GB, live: 10 * GB, documents: 620_000 }, // compactIndex: after
    ]);
    const policy = createCompactionPolicy({ client, everyDocs: 100_000, minRatio: 1.4 });
    await policy.afterDrain();
    const report = await policy.afterDrain();
    assert.ok(report, "a compaction should have run");
    assert.equal(compactions.length, 1);
    assert.equal(report.reclaimedBytes, 9 * GB);
  });

  test("waits for the cadence even when the file is badly fragmented", async () => {
    const { client, compactions } = fakeClient([
      { file: 40 * GB, live: 10 * GB, documents: 500_000 },
      { file: 40 * GB, live: 10 * GB, documents: 540_000 }, // only +40k
    ]);
    const policy = createCompactionPolicy({ client, everyDocs: 100_000, minRatio: 1.4 });
    await policy.afterDrain();
    assert.equal(await policy.afterDrain(), null);
    assert.deepEqual(compactions, [], "cadence gates the check");
  });

  test("skips the copy when the file is already dense", async () => {
    // Compaction rewrites the whole index either way; on a full corpus that is ~19
    // minutes of I/O, so reclaiming nothing has to be worth refusing.
    const { client, compactions } = fakeClient([
      { file: 21 * GB, live: 20 * GB, documents: 500_000 },
      { file: 21 * GB, live: 20 * GB, documents: 700_000 }, // +200k but ratio 1.05
    ]);
    const policy = createCompactionPolicy({ client, everyDocs: 100_000, minRatio: 1.4 });
    await policy.afterDrain();
    assert.equal(await policy.afterDrain(), null);
    assert.deepEqual(compactions, []);
  });

  test("a skipped check still resets the cadence", async () => {
    // Otherwise every later drain re-reads stats hoping the ratio moved.
    const { client, compactions } = fakeClient([
      { file: 21 * GB, live: 20 * GB, documents: 500_000 },
      { file: 21 * GB, live: 20 * GB, documents: 700_000 }, // dense: skipped
      { file: 60 * GB, live: 20 * GB, documents: 760_000 }, // +60k since the skip
    ]);
    const policy = createCompactionPolicy({ client, everyDocs: 100_000, minRatio: 1.4 });
    await policy.afterDrain();
    await policy.afterDrain();
    assert.equal(await policy.afterDrain(), null, "cadence restarts from the skip");
    assert.deepEqual(compactions, []);
  });

  test("a fresh instance reporting no live bytes is treated as dense, not divided by zero", async () => {
    const { client, compactions } = fakeClient([
      { file: 0, live: 0, documents: 0 },
      { file: 2 * GB, live: 0, documents: 200_000 },
    ]);
    const policy = createCompactionPolicy({ client, everyDocs: 100_000, minRatio: 1.4 });
    await policy.afterDrain();
    assert.equal(await policy.afterDrain(), null);
    assert.deepEqual(compactions, []);
  });
});
