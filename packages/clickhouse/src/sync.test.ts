import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import type { TCrawledThesis } from "@tezara/core";
import { rebuildAggregates } from "./aggregates.ts";
import { createClickhouseClient, type ClickHouseClient } from "./client.ts";
import { appliedMigrations, migrate } from "./migrate.ts";
import { MIGRATIONS } from "./schema.ts";
import { syncTheses } from "./sync.ts";

const url = process.env.CLICKHOUSE_TEST_URL ?? "http://default:chpass@127.0.0.1:8123";
const database = "tezara_test";

let client: ClickHouseClient;

const thesis = (over: Partial<TCrawledThesis> = {}): TCrawledThesis => ({
  id: 1,
  title_original: "Bir başlık",
  title_translated: null,
  author: "AYŞE YILMAZ",
  advisors: ["PROF. DR. MEHMET DEMİR"],
  university: "Yalova Üniversitesi",
  institute: "Sosyal Bilimler Enstitüsü",
  department: "Sosyoloji Ana Bilim Dalı",
  branch: null,
  detail_id_1: "k1",
  detail_id_2: "k2",
  year: 2023,
  thesis_type: "Yüksek Lisans",
  language: "Türkçe",
  subjects: [
    { name: "Sosyoloji", language: "Turkish" },
    { name: "Sociology", language: "English" },
  ],
  keywords: [{ name: "kentleşme", language: "Turkish" }],
  abstract_original: null,
  abstract_translated: null,
  page_count: null,
  pdf_url: null,
  restricted: false,
  ...over,
});

const scalar = async (query: string): Promise<number> => {
  const res = await client.query({ query, format: "JSONEachRow" });
  const rows = await res.json<Record<string, string>>();
  return Number(Object.values(rows[0] ?? { v: 0 })[0]);
};

before(async () => {
  const bootstrap = createClickhouseClient({ url });
  await bootstrap.command({ query: `DROP DATABASE IF EXISTS ${database}` });
  await bootstrap.command({ query: `CREATE DATABASE ${database}` });
  await bootstrap.close();
  client = createClickhouseClient({ url, database });
});

beforeEach(async () => {
  for (const table of [
    "theses", "subjects", "keywords", "advisors",
    "thesis_subjects", "thesis_keywords", "thesis_advisors",
  ]) {
    await client.command({ query: `TRUNCATE TABLE IF EXISTS ${table}` }).catch(() => {});
  }
});

after(async () => {
  await client.command({ query: `DROP DATABASE IF EXISTS ${database}` }).catch(() => {});
  await client.close();
});

describe("migrations", () => {
  test("apply cleanly from an empty database", async () => {
    const ran = await migrate(client);
    // The ledger's own CREATE runs first so we can read the applied set, then it is
    // recorded like any other migration (the statement is IF NOT EXISTS).
    assert.equal(ran.length, MIGRATIONS.length);
    assert.equal((await appliedMigrations(client)).length, MIGRATIONS.length);
  });

  test("are idempotent — a second run applies nothing", async () => {
    assert.deepEqual(await migrate(client), [], "already applied");
  });

  test("contain no DROP TABLE on any data path", () => {
    for (const m of MIGRATIONS) {
      assert.ok(!/DROP\s+TABLE/i.test(m.sql), `${m.id} must not drop tables`);
    }
  });

  test("theses uses ReplacingMergeTree so re-pushing cannot duplicate", async () => {
    const res = await client.query({
      query: `SELECT engine_full FROM system.tables WHERE database = '${database}' AND name = 'theses'`,
      format: "JSONEachRow",
    });
    const [row] = await res.json<{ engine_full: string }>();
    assert.match(row!.engine_full, /ReplacingMergeTree/);
  });
});

describe("sync", () => {
  test("inserts a thesis and its dimensions", async () => {
    const report = await syncTheses(client, [thesis()]);
    assert.equal(report.theses, 1);
    assert.equal(report.subjects, 2);
    assert.equal(await scalar("SELECT count() FROM theses FINAL"), 1);
    assert.equal(await scalar("SELECT count() FROM thesis_subjects FINAL"), 2);
    assert.equal(await scalar("SELECT count() FROM advisors FINAL"), 1);
  });

  test("re-pushing the same thesis does not duplicate it", async () => {
    // The old schema's plain MergeTree silently doubled every count on a re-run.
    await syncTheses(client, [thesis()]);
    await syncTheses(client, [thesis()]);
    await syncTheses(client, [thesis()]);
    assert.equal(await scalar("SELECT count() FROM theses FINAL"), 1);
    assert.equal(await scalar("SELECT count() FROM thesis_subjects FINAL"), 2);
  });

  test("an updated thesis replaces the previous row", async () => {
    await syncTheses(client, [thesis({ author: "ESKI AD" })]);
    await syncTheses(client, [thesis({ author: "YENI AD" })]);
    const res = await client.query({
      query: "SELECT author FROM theses FINAL WHERE id = 1",
      format: "JSONEachRow",
    });
    const rows = await res.json<{ author: string }>();
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.author, "YENI AD");
  });

  test("restricted is stored", async () => {
    await syncTheses(client, [thesis({ id: 7, restricted: true })]);
    assert.equal(await scalar("SELECT restricted FROM theses FINAL WHERE id = 7"), 1);
  });

  test("an empty batch is a no-op", async () => {
    const report = await syncTheses(client, []);
    assert.equal(report.theses, 0);
  });
});

describe("aggregate rebuild", () => {
  test("populates the tables the web app reads", async () => {
    await syncTheses(client, [
      thesis({ id: 1 }),
      thesis({ id: 2, author: "ALİ VELİ", year: 2020 }),
      thesis({ id: 3, university: "Ege Üniversitesi", author: "ZEHRA AK" }),
    ]);
    const rebuilt = await rebuildAggregates(client);
    assert.deepEqual(rebuilt, ["universities", "subject_stats", "thesis_subjects_by_university"]);

    assert.equal(await scalar("SELECT count() FROM universities"), 2);
    assert.equal(
      await scalar("SELECT thesis_count FROM universities WHERE name = 'Yalova Üniversitesi'"),
      2,
    );
    assert.equal(
      await scalar("SELECT year_start FROM universities WHERE name = 'Yalova Üniversitesi'"),
      2020,
    );
    assert.ok(await scalar("SELECT count() FROM subject_stats") > 0);
  });

  test("counts are not inflated by a re-push", async () => {
    await syncTheses(client, [thesis({ id: 1 })]);
    await syncTheses(client, [thesis({ id: 1 })]);
    await rebuildAggregates(client);
    assert.equal(
      await scalar("SELECT thesis_count FROM universities WHERE name = 'Yalova Üniversitesi'"),
      1,
      "FINAL must dedup before aggregating",
    );
  });

  test("the target table is never empty during a rebuild", async () => {
    await syncTheses(client, [thesis({ id: 1 })]);
    await rebuildAggregates(client);
    const before = await scalar("SELECT count() FROM universities");

    await syncTheses(client, [thesis({ id: 2, university: "Ege Üniversitesi" })]);
    // Read concurrently with the rebuild; EXCHANGE TABLES makes the swap atomic, so a
    // reader sees either the old contents or the new ones — never a dropped table.
    const [, during] = await Promise.all([
      rebuildAggregates(client),
      (async () => {
        const seen: number[] = [];
        for (let i = 0; i < 12; i++) {
          seen.push(await scalar("SELECT count() FROM universities"));
        }
        return seen;
      })(),
    ]);
    assert.ok(during.every((n) => n >= before), `never empty mid-swap, saw ${during}`);
    assert.equal(await scalar("SELECT count() FROM universities"), 2);
  });
});
