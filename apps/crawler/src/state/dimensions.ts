import type { IndexName, KnownDocs } from "@tezara/meili";
import type { Redis } from "ioredis";
import type { Keys } from "./keys.ts";

/**
 * Which dimension names have already been pushed to Meili, as one Redis set per index.
 *
 * The dimension indexes are derived from a stream of theses but they are not a stream.
 * There are ~210 universities, ~60 institutes, five languages, four thesis types and a
 * fixed subject taxonomy: a few thousand names in total, all of which recur in every
 * batch for the entire life of the crawl. Pushing them every time meant seven awaited
 * Meili tasks per batch that could not change anything in the index, and a drain waits
 * for every task it submits.
 *
 * Deliberately only the saturating indexes (see `saturates` in @tezara/meili) — the
 * whole thing holds a few thousand ids, so it costs well under a megabyte and stays
 * worth having. Remembering authors or keywords instead would grow with the corpus.
 *
 * Written without a TTL, like the rest of the crawl state: under
 * `maxmemory-policy volatile-lru` that keeps it out of reach of eviction. Losing it
 * would not corrupt anything — the next drain would simply re-push every name once —
 * but silently dropping half of it would leave gaps that nothing goes back to fill.
 * `wipe` clears it along with every other key under the prefix.
 */
export class DimensionCache implements KnownDocs {
  readonly #redis: Redis;
  readonly #prefix: string;

  constructor(redis: Redis, keys: Keys) {
    this.#redis = redis;
    this.#prefix = `${keys.prefix}:dim`;
  }

  #key(index: IndexName): string {
    return `${this.#prefix}:${index}`;
  }

  async unseen(index: IndexName, ids: readonly string[]): Promise<ReadonlySet<string>> {
    if (ids.length === 0) return new Set();
    // SMISMEMBER answers the whole batch in one round trip and returns 1/0 positionally.
    const flags = await this.#redis.smismember(this.#key(index), ...ids);
    const out = new Set<string>();
    ids.forEach((id, i) => {
      if (flags[i] !== 1) out.add(id);
    });
    return out;
  }

  async remember(index: IndexName, ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.#redis.sadd(this.#key(index), ...ids);
  }

  /** How many names are remembered per index — for the status page. */
  async sizes(): Promise<Record<string, number>> {
    const keys = await this.#redis.keys(`${this.#prefix}:*`);
    const sizes: Record<string, number> = {};
    for (const key of keys) {
      sizes[key.slice(this.#prefix.length + 1)] = await this.#redis.scard(key);
    }
    return sizes;
  }
}
