import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import type { MeiliSearch } from "@tezara/meili";
import { INDEXES, INDEX_NAMES } from "@tezara/meili";
import type { TCrawledThesis } from "@tezara/core";
import type { Redis } from "ioredis";
import { DimensionCache } from "../state/dimensions.ts";
import { makeKeys, type Keys } from "../state/keys.ts";
import { Outbox } from "../state/outbox.ts";
import { createRedis } from "../state/redis.ts";
import { syncMeili } from "./sync-meili.ts";

let redis: Redis;
let keys: Keys;
let outbox: Outbox;

/**
 * A Meili stand-in that records which indexes were pushed to, and how much.
 *
 * Reports settings straight from the index definitions, so verifySettings sees no drift
 * and the drain gets past its migration guard. `delayMs` makes a push take measurable
 * time, which is how the budget is exercised without waiting minutes for it.
 */
function fakeClient(opts: { delayMs?: number } = {}) {
  const pushes: { index: string; docs: number }[] = [];
  const client = {
    getIndexes: async () => ({ results: INDEX_NAMES.map((uid) => ({ uid })) }),
    // The task queue as the drain sees it: always settled, every push already done.
    getTask: async (uid: number) => ({ uid, status: "succeeded" }),
    getTasks: async (q?: { uids?: number[] }) => ({
      results: (q?.uids ?? []).map((uid) => ({ uid, status: "succeeded" })),
      total: q?.uids?.length ?? 0,
    }),
    index: (name: string) => ({
      getSettings: async () => ({
        filterableAttributes: INDEXES[name as keyof typeof INDEXES].filterable ?? [],
        sortableAttributes: INDEXES[name as keyof typeof INDEXES].sortable ?? [],
        searchableAttributes: INDEXES[name as keyof typeof INDEXES].searchable ?? ["*"],
        pagination: { maxTotalHits: INDEXES[name as keyof typeof INDEXES].maxTotalHits },
      }),
      addDocuments: async (docs: unknown[]) => {
        if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs));
        pushes.push({ index: name, docs: docs.length });
        return { taskUid: pushes.length };
      },
    }),
  };
  return {
    client: client as unknown as MeiliSearch,
    pushes,
    get indexesTouched() {
      return new Set(pushes.map((p) => p.index));
    },
  };
}

const thesis = (id: number): TCrawledThesis =>
  ({
    id,
    title_original: `t${id}`,
    title_translated: null,
    author: `YAZAR ${id}`,
    advisors: ["DANIŞMAN"],
    university: "Yalova Üniversitesi",
    institute: "Fen Bilimleri Enstitüsü",
    department: null,
    branch: null,
    detail_id_1: "k1",
    detail_id_2: "k2",
    year: 2023,
    thesis_type: "Yüksek Lisans",
    language: "Türkçe",
    subjects: [{ name: "Sosyoloji", language: "Turkish" }],
    keywords: [{ name: "kentleşme", language: "Turkish" }],
    abstract_original: null,
    abstract_translated: null,
    page_count: null,
    pdf_url: null,
    restricted: false,
  }) as TCrawledThesis;

before(() => {
  redis = createRedis();
  keys = makeKeys(`tezara:test:syncmeili:${process.pid}:${Math.random().toString(36).slice(2, 8)}`);
});

beforeEach(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  outbox = new Outbox(redis, keys, ["meili"]);
});

after(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  await redis.quit();
});

describe("syncMeili", () => {
  test("drains the whole outbox rather than stopping at a fixed batch count", async () => {
    await outbox.push([...Array(25)].map((_, i) => thesis(i + 1)));
    const meili = fakeClient();

    const result = await syncMeili({ client: meili.client, outbox }, { batchSize: 5 });

    assert.equal(result.pushed, 25);
    assert.equal(result.batches, 5, "five batches of five, no cap in the way");
    assert.equal(result.remaining, 0);
    assert.equal(await outbox.depth("meili"), 0);
  });

  test("stops on its time budget and reports what is left", async () => {
    await outbox.push([...Array(20)].map((_, i) => thesis(i + 1)));
    // Every index push sleeps, so one batch comfortably outlives the budget.
    const meili = fakeClient({ delayMs: 15 });

    const result = await syncMeili(
      { client: meili.client, outbox },
      { batchSize: 5, budgetMs: 1 },
    );

    assert.equal(result.batches, 1, "the budget is checked before starting a batch");
    assert.equal(result.remaining, 15, "the rest stays in the outbox for the next run");
    assert.equal(result.budgetExpired, true, "which is what tells the worker to re-arm");
    assert.equal(await outbox.depth("meili"), 15);
  });

  test("a drain that empties the outbox does not ask to be re-armed", async () => {
    await outbox.push([thesis(1), thesis(2)]);
    const meili = fakeClient();

    const result = await syncMeili({ client: meili.client, outbox }, { batchSize: 1 });

    assert.equal(result.remaining, 0);
    assert.equal(
      result.budgetExpired,
      undefined,
      "re-arming here would collide with this job's own id inside the same minute",
    );
  });

  test("without a cache, every batch re-pushes the same dimension names", async () => {
    await outbox.push([thesis(1), thesis(2)]);
    const meili = fakeClient();

    await syncMeili({ client: meili.client, outbox }, { batchSize: 1 });

    const universities = meili.pushes.filter((p) => p.index === "universities");
    assert.equal(universities.length, 2, "same university pushed once per batch");
  });

  test("with a cache, a saturating dimension is pushed once and then skipped", async () => {
    await outbox.push([thesis(1), thesis(2), thesis(3)]);
    const meili = fakeClient();
    const known = new DimensionCache(redis, keys);

    await syncMeili({ client: meili.client, outbox, known }, { batchSize: 1 });

    for (const index of ["universities", "institutes", "languages", "thesis_types", "subjects"]) {
      assert.equal(
        meili.pushes.filter((p) => p.index === index).length,
        1,
        `${index} must be pushed once, not once per batch`,
      );
    }
    // The ones that grow with the corpus are deliberately not cached.
    assert.equal(meili.pushes.filter((p) => p.index === "theses").length, 3);
    assert.equal(meili.pushes.filter((p) => p.index === "authors").length, 3);

    // And it recorded exactly the saturating indexes — nothing per-thesis leaked in.
    assert.deepEqual(await known.sizes(), {
      universities: 1, institutes: 1, languages: 1, thesis_types: 1, subjects: 1,
    });
  });

  test("a cache carried across runs keeps skipping", async () => {
    const meili = fakeClient();
    const known = new DimensionCache(redis, keys);

    await outbox.push([thesis(1)]);
    await syncMeili({ client: meili.client, outbox, known }, { batchSize: 1 });
    const afterFirst = meili.pushes.filter((p) => p.index === "universities").length;

    await outbox.push([thesis(2)]);
    await syncMeili({ client: meili.client, outbox, known }, { batchSize: 1 });

    assert.equal(afterFirst, 1);
    assert.equal(
      meili.pushes.filter((p) => p.index === "universities").length,
      1,
      "a second job must not re-push what the first one already sent",
    );
  });
});
