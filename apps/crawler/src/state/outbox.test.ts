import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import type { TCrawledThesis } from "@tezara/core";
import type { Redis } from "ioredis";
import { makeKeys, type Keys } from "./keys.ts";
import { Outbox } from "./outbox.ts";
import { createRedis } from "./redis.ts";

let redis: Redis;
let keys: Keys;
let outbox: Outbox;

const thesis = (id: number, title = `t${id}`) =>
  ({
    id, title_original: title, title_translated: null, author: `A${id}`,
    advisors: [], university: "U", institute: "I", department: null, branch: null,
    detail_id_1: "k1", detail_id_2: "k2", year: 2023, thesis_type: "T", language: "L",
    subjects: [], keywords: [], abstract_original: null, abstract_translated: null,
    page_count: null, pdf_url: null, restricted: false,
  }) as TCrawledThesis;

before(() => {
  redis = createRedis();
  keys = makeKeys(`tezara:test:outbox:${process.pid}:${Math.random().toString(36).slice(2, 8)}`);
});

beforeEach(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  outbox = new Outbox(redis, keys);
});

after(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  await redis.quit();
});

/** How many payload copies exist — the whole point of the shared outbox is: one. */
async function docCount(): Promise<number> {
  return (await redis.keys(`${keys.prefix}:outbox:doc:*`)).length;
}

describe("shared outbox", () => {
  test("one push stores one payload but queues for both targets", async () => {
    await outbox.push([thesis(1), thesis(2)]);

    assert.equal(await outbox.depth("meili"), 2);
    assert.equal(await outbox.depth("clickhouse"), 2);
    assert.equal(await docCount(), 2, "payload stored once, not per target");
  });

  test("peek returns the documents without removing them", async () => {
    await outbox.push([thesis(1), thesis(2), thesis(3)]);

    const batch = await outbox.peek("meili", 2);
    assert.deepEqual(batch.map((t) => t.id), [1, 2]);
    assert.equal(await outbox.depth("meili"), 3, "peek is not destructive");
  });

  test("committing one target keeps the payload for the other", async () => {
    await outbox.push([thesis(1)]);

    await outbox.commit("meili", [1]);

    assert.equal(await outbox.depth("meili"), 0);
    assert.equal(await outbox.depth("clickhouse"), 1);
    assert.equal(await docCount(), 1, "clickhouse still needs it");
    assert.equal((await outbox.peek("clickhouse", 1))[0]?.id, 1);
  });

  test("committing the last target deletes the payload", async () => {
    await outbox.push([thesis(1)]);

    await outbox.commit("meili", [1]);
    await outbox.commit("clickhouse", [1]);

    assert.equal(await docCount(), 0, "nothing left once every target has it");
  });

  test("re-pushing a pending id overwrites the payload without duplicating it", async () => {
    await outbox.push([thesis(1, "old title")]);
    await outbox.push([thesis(1, "new title")]);

    assert.equal(await outbox.depth("meili"), 1, "same id, one queue entry");
    assert.equal(await docCount(), 1);
    assert.equal((await outbox.peek("meili", 1))[0]?.title_original, "new title");
  });

  test("pushes drain in arrival order", async () => {
    await outbox.push([thesis(5)]);
    await outbox.push([thesis(2)]);
    await outbox.push([thesis(9)]);

    const batch = await outbox.peek("meili", 10);
    assert.deepEqual(batch.map((t) => t.id), [5, 2, 9], "FIFO by push, not by id");
  });

  test("a Meili-only outbox never queues for clickhouse", async () => {
    const meiliOnly = new Outbox(redis, keys, ["meili"]);
    await meiliOnly.push([thesis(1)]);

    assert.equal(await meiliOnly.depth("meili"), 1);
    assert.equal(await meiliOnly.depth("clickhouse"), 0);

    await meiliOnly.commit("meili", [1]);
    assert.equal(await docCount(), 0, "the sole target's commit frees the payload");
  });

  test("an id whose payload vanished is dropped from the queue, not peeked forever", async () => {
    await outbox.push([thesis(1), thesis(2)]);
    await redis.del(`${keys.prefix}:outbox:doc:1`);

    const batch = await outbox.peek("meili", 10);
    assert.deepEqual(batch.map((t) => t.id), [2]);
    assert.equal(await outbox.depth("meili"), 1, "the debris entry is gone");
  });

  test("quarantine keeps its own bounded list per target", async () => {
    await outbox.quarantine("meili", [{ id: 7 }], "invalid_document_fields");
    const dead = await outbox.dead("meili");
    assert.equal(dead.length, 1);
    assert.equal(dead[0]?.reason, "invalid_document_fields");
    assert.equal(await outbox.deadDepth("meili"), 1);
    assert.equal(await outbox.deadDepth("clickhouse"), 0);
  });

  test("drain locks per target, not globally", async () => {
    const both = await outbox.drain("meili", async () =>
      outbox.drain("clickhouse", async () => "ran"),
    );
    assert.equal(both, "ran", "one target's drain must not block the other's");

    const nested = await outbox.drain("meili", async () =>
      outbox.drain("meili", async () => "ran"),
    );
    assert.equal(nested, null, "the same target is single-drainer");
  });
});
