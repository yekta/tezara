import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { TCrawledThesis } from "@tezara/core";
import { createMeiliClient, type MeiliSearch } from "./client.ts";
import { INDEXES, INDEX_NAMES, md5 } from "./indexes.ts";
import { applySettings } from "./settings.ts";
import { deleteTheses, type Rejection, syncTheses } from "./sync.ts";

// Throwaway local instance; see MEILI_TEST_HOST to point elsewhere.
const host = process.env.MEILI_TEST_HOST ?? "http://127.0.0.1:7700";
const apiKey = process.env.MEILI_TEST_KEY ?? "testMasterKey123";

let client: MeiliSearch;

const thesis = (over: Partial<TCrawledThesis> = {}): TCrawledThesis => ({
  id: 1,
  title_original: "Bir başlık",
  title_translated: "A title",
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
  abstract_original: "Özet metni",
  abstract_translated: "Abstract text",
  page_count: null,
  pdf_url: "https://tez.yok.gov.tr/UlusalTezMerkezi/TezGoster?key=abc",
  restricted: false,
  ...over,
});

before(async () => {
  client = createMeiliClient({ host, apiKey });
  for (const name of INDEX_NAMES) {
    try {
      const t = await client.deleteIndex(name);
      await client.waitForTask(t.taskUid);
    } catch {
      // absent is fine
    }
  }
  await applySettings(client, { waitForTasks: true });
});

after(async () => {
  for (const name of INDEX_NAMES) {
    try {
      const t = await client.deleteIndex(name);
      await client.waitForTask(t.taskUid);
    } catch {
      /* ignore */
    }
  }
  // Leave the instance migrated: a bare index would let a later sync auto-create it
  // with Meili's defaults and silently break every filter.
  await applySettings(client, { waitForTasks: true });
});

describe("meili sync", () => {
  test("settings are applied from the declarative definitions", async () => {
    const settings = await client.index("theses").getSettings();
    assert.deepEqual(
      [...(settings.filterableAttributes ?? [])].sort(),
      [...INDEXES.theses.filterable!].sort(),
    );
    assert.deepEqual(
      [...(settings.sortableAttributes ?? [])].sort(),
      [...INDEXES.theses.sortable!].sort(),
    );
    assert.equal(settings.pagination?.maxTotalHits, 1_500_000);
  });

  test("a thesis lands in every derived index", async () => {
    const report = await syncTheses(client, [thesis()], { waitForTasks: true });
    assert.equal(report.theses, 1);
    assert.equal(report.universities, 1);
    assert.equal(report.advisors, 1);
    assert.equal(report.subjects, 2, "both languages");
    assert.equal(report.keywords, 1);
    assert.equal(report.branches, 0, "null fields produce no document");

    const doc = await client.index("theses").getDocument(1);
    assert.equal(doc.author, "AYŞE YILMAZ");
    assert.equal(doc.restricted, false);
    assert.equal(await (await client.index("universities").getDocument(md5("Yalova Üniversitesi"))).name, "Yalova Üniversitesi");
  });

  test("re-syncing the same thesis is idempotent, not duplicative", async () => {
    await syncTheses(client, [thesis()], { waitForTasks: true });
    await syncTheses(client, [thesis()], { waitForTasks: true });
    const stats = await client.index("theses").getStats();
    assert.equal(stats.numberOfDocuments, 1);
    const unis = await client.index("universities").getStats();
    assert.equal(unis.numberOfDocuments, 1, "same university must not duplicate");
  });

  test("two theses sharing a university yield one university document", async () => {
    await syncTheses(
      client,
      [thesis({ id: 10 }), thesis({ id: 11, author: "ALİ VELİ" })],
      { waitForTasks: true },
    );
    const unis = await client.index("universities").getStats();
    assert.equal(unis.numberOfDocuments, 1);
    const authors = await client.index("authors").getStats();
    assert.equal(authors.numberOfDocuments, 2);
  });

  test("an updated thesis overwrites rather than appends", async () => {
    await syncTheses(client, [thesis({ id: 20, author: "ESKI AD" })], { waitForTasks: true });
    await syncTheses(client, [thesis({ id: 20, author: "YENI AD" })], { waitForTasks: true });
    const doc = await client.index("theses").getDocument(20);
    assert.equal(doc.author, "YENI AD");
  });

  test("filters work on the attributes the web app actually queries", async () => {
    await syncTheses(
      client,
      [thesis({ id: 30, year: 2020 }), thesis({ id: 31, year: 2023 })],
      { waitForTasks: true },
    );
    const res = await client.index("theses").search("", { filter: "year = 2023", limit: 100 });
    assert.ok(res.hits.every((h) => h.year === 2023));
    assert.ok(res.hits.some((h) => h.id === 31));

    const bySubject = await client
      .index("theses")
      .search("", { filter: 'subjects.name = "Sosyoloji"', limit: 100 });
    assert.ok(bySubject.hits.length > 0, "nested subject filter must work");
  });

  test("deleting removes from theses only, leaving dimensions intact", async () => {
    await syncTheses(client, [thesis({ id: 40 })], { waitForTasks: true });
    await deleteTheses(client, [40], { waitForTasks: true });
    await assert.rejects(() => client.index("theses").getDocument(40));
    const unis = await client.index("universities").getStats();
    assert.ok(unis.numberOfDocuments >= 1, "shared dimensions survive a thesis deletion");
  });

  test("an empty batch is a no-op", async () => {
    const report = await syncTheses(client, [], { waitForTasks: true });
    assert.equal(report.theses, 0);
    assert.equal(await deleteTheses(client, []), 0);
  });

  // A non-integer id is refused by Meili for the whole task, so it also kills the
  // documents batched alongside it — which is what makes bisecting worth the trouble.
  const poison = () => thesis({ id: 50.5 as number });

  test("a failed task is an error, not a silent success", async () => {
    await assert.rejects(
      () => syncTheses(client, [poison()], { waitForTasks: true }),
      /Document identifier/,
    );
  });

  test("a refused document is bisected out and the rest of the batch still lands", async () => {
    const rejections: Rejection[] = [];
    const report = await syncTheses(
      client,
      [thesis({ id: 51 }), poison(), thesis({ id: 52 })],
      { waitForTasks: true, onReject: (r) => void rejections.push(r) },
    );

    assert.equal(report.theses, 2, "the two sound theses are indexed");
    assert.equal((await client.index("theses").getDocument(51)).id, 51);
    assert.equal((await client.index("theses").getDocument(52)).id, 52);
    await assert.rejects(() => client.index("theses").getDocument("50.5"));

    const dropped = rejections.filter((r) => r.dropped);
    assert.equal(dropped.length, 1, "only the offending document is given up on");
    assert.equal(dropped[0]!.docs[0]!.id, 50.5);
    assert.equal(dropped[0]!.index, "theses");
    assert.ok(dropped[0]!.payloadBytes > 0);
    assert.match(dropped[0]!.reason, /Document identifier/);
  });
});
