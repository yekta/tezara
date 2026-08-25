/**
 * The web app shares this Redis as its page cache, so everything the crawler owns is
 * namespaced. Everything under the prefix is transient or cheaply rebuildable — the
 * outbox buffer, the circuit breaker, the dimension cache, per-year drift diagnostics.
 * The durable crawl state (which ids were visited, watermarks) lives in ClickHouse.
 */
export type Keys = ReturnType<typeof makeKeys>;

export function makeKeys(prefix: string) {
  return {
    prefix,
    lock: (name: string) => `${prefix}:lock:${name}`,
  };
}

export const DEFAULT_PREFIX = "tezara:crawler";
