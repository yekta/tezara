import type { TCrawledThesis } from "@tezara/core";
import type { Redis } from "ioredis";
import type { Keys } from "./keys.ts";

/**
 * Crawled theses land here before they reach Meili.
 *
 * Decoupling the two means a Meili outage costs nothing: the crawl keeps running and
 * the backlog drains when Meili returns. Draining is destructive-on-success only —
 * documents are removed after the push is acknowledged, never before.
 */
export class Outbox {
  readonly #redis: Redis;
  readonly #key: string;

  constructor(redis: Redis, keys: Keys) {
    this.#redis = redis;
    this.#key = `${keys.prefix}:outbox:meili`;
  }

  async push(theses: readonly TCrawledThesis[]): Promise<number> {
    if (theses.length === 0) return 0;
    return this.#redis.rpush(this.#key, ...theses.map((t) => JSON.stringify(t)));
  }

  /** Read a batch without removing it — commit() does that once the push succeeded. */
  async peek(limit: number): Promise<TCrawledThesis[]> {
    const raw = await this.#redis.lrange(this.#key, 0, limit - 1);
    return raw.map((r) => JSON.parse(r) as TCrawledThesis);
  }

  async commit(count: number): Promise<void> {
    if (count > 0) await this.#redis.ltrim(this.#key, count, -1);
  }

  async depth(): Promise<number> {
    return this.#redis.llen(this.#key);
  }
}
