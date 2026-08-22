import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createMeiliClient, type MeiliSearch } from "./client.ts";
import { INDEX_NAMES } from "./indexes.ts";
import { applySettings, verifySettings } from "./settings.ts";

const host = process.env.MEILI_TEST_HOST ?? "http://127.0.0.1:7700";
const apiKey = process.env.MEILI_TEST_KEY ?? "testMasterKey123";

let client: MeiliSearch;

const dropAll = async () => {
  for (const name of INDEX_NAMES) {
    try {
      const t = await client.deleteIndex(name);
      await client.waitForTask(t.taskUid);
    } catch {
      /* absent is fine */
    }
  }
};

before(async () => {
  client = createMeiliClient({ host, apiKey });
  await dropAll();
});

after(async () => {
  await dropAll();
  await applySettings(client, { waitForTasks: true });
});

describe("settings", () => {
  test("missing indexes are reported as drift", async () => {
    const drift = await verifySettings(client);
    assert.equal(drift.length, INDEX_NAMES.length, "every index is absent");
    assert.ok(drift.every((d) => d.missing), "absent, not merely misconfigured");
  });

  // Applying a subset is how the crawler heals a fresh instance on its own without
  // touching indexes that already hold documents.
  test("only the named indexes are created when applying a subset", async () => {
    const applied = await applySettings(client, { only: ["branches"], waitForTasks: true });
    assert.deepEqual(applied, ["branches"]);

    const drift = await verifySettings(client);
    assert.equal(drift.length, INDEX_NAMES.length - 1, "the rest are untouched");
    assert.ok(!drift.some((d) => d.index === "branches"), "branches is configured");

    const dropped = await client.deleteIndex("branches");
    await client.waitForTask(dropped.taskUid);
  });

  test("addDocuments silently auto-creates an index with Meili defaults", async () => {
    // This is the failure mode verifySettings exists to catch: syncing before migrating
    // leaves the index usable for search but with NO filterable attributes, so every
    // filter the web app sends returns nothing — and nothing errors.
    const task = await client
      .index("theses")
      .addDocuments([{ id: 1, year: 2020 }], { primaryKey: "id" });
    await client.index("theses").waitForTask(task.taskUid);

    const settings = await client.index("theses").getSettings();
    assert.deepEqual(settings.filterableAttributes, [], "defaults have no filters");
    assert.equal(settings.pagination?.maxTotalHits, 1000, "default cap, not ours");

    const drift = await verifySettings(client);
    const theses = drift.find((d) => d.index === "theses");
    assert.ok(theses, "drift must be reported");
    assert.ok(theses.missingFilterable.includes("year"));
    assert.equal(theses.maxTotalHits.actual, 1000);
  });

  test("applySettings fixes the drift", async () => {
    await applySettings(client, { waitForTasks: true });
    assert.deepEqual(await verifySettings(client), []);
  });

  test("applySettings is idempotent", async () => {
    await applySettings(client, { waitForTasks: true });
    await applySettings(client, { waitForTasks: true });
    assert.deepEqual(await verifySettings(client), []);
  });

  test("filtering works once settings are applied", async () => {
    const task = await client
      .index("theses")
      .addDocuments([{ id: 2, year: 1999 }], { primaryKey: "id" });
    await client.index("theses").waitForTask(task.taskUid);

    const res = await client.index("theses").search("", { filter: "year = 1999" });
    assert.equal(res.hits.length, 1);
    assert.equal(res.hits[0]?.id, 2);
  });
});
