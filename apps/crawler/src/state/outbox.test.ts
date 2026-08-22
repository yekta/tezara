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

const thesis = (id: number) => ({ id, title_original: `t${id}` }) as TCrawledThesis;

before(() => {
  redis = createRedis();
  keys = makeKeys(`tezara:test:outbox:${process.pid}:${Math.random().toString(36).slice(2, 8)}`);
});

beforeEach(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  outbox = new Outbox(redis, keys, "meili");
});

after(async () => {
  const existing = await redis.keys(`${keys.prefix}*`);
  if (existing.length) await redis.del(...existing);
  await redis.quit();
});

describe("outbox", () => {
  test("peek reads the head without removing it; commit removes it", async () => {
    await outbox.push([thesis(1), thesis(2), thesis(3)]);

    assert.deepEqual((await outbox.peek(2)).map((t) => t.id), [1, 2]);
    assert.equal(await outbox.depth(), 3, "peek is not destructive");

    await outbox.commit(2);
    assert.deepEqual((await outbox.peek(10)).map((t) => t.id), [3]);
  });

  test("only one drain runs at a time", async () => {
    await outbox.push([thesis(1), thesis(2)]);

    let running = 0;
    let overlapped = false;
    const drain = () =>
      outbox.drain(async () => {
        overlapped ||= ++running > 1;
        await new Promise((r) => setTimeout(r, 50));
        running--;
        return "ran";
      });

    const results = await Promise.all([drain(), drain(), drain()]);

    assert.equal(overlapped, false);
    assert.equal(results.filter((r) => r === "ran").length, 1);
    assert.equal(results.filter((r) => r === null).length, 2, "the losers skip, not wait");
  });

  test("a released lock lets the next drain through", async () => {
    assert.equal(await outbox.drain(async () => 1), 1);
    assert.equal(await outbox.drain(async () => 2), 2);
  });

  test("the lock is released even when the drain throws", async () => {
    await assert.rejects(() => outbox.drain(async () => { throw new Error("boom"); }));
    assert.equal(await outbox.drain(async () => "free"), "free");
  });

  test("quarantined documents are parked with their reason, not lost silently", async () => {
    await outbox.quarantine([thesis(9)], "Document identifier `9.5` is invalid");

    assert.equal(await outbox.deadDepth(), 1);
    const [raw] = await redis.lrange(`${keys.prefix}:outbox:meili:dead`, 0, -1);
    const entry = JSON.parse(raw!) as { reason: string; doc: { id: number }; at: string };
    assert.match(entry.reason, /Document identifier/);
    assert.equal(entry.doc.id, 9);
    assert.ok(Date.parse(entry.at) > 0);
  });

  test("quarantining nothing is a no-op", async () => {
    await outbox.quarantine([], "unused");
    assert.equal(await outbox.deadDepth(), 0);
  });

  test("each target keeps its own queue", async () => {
    const clickhouse = new Outbox(redis, keys, "clickhouse");
    await outbox.push([thesis(1)]);
    assert.equal(await clickhouse.depth(), 0);
  });
});
