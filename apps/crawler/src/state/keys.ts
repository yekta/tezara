/**
 * The web app shares this Redis as its page cache, so everything the crawler owns is
 * namespaced. Crawl-state keys are also deliberately written WITHOUT a TTL: with
 * `maxmemory-policy volatile-lru` that makes them ineligible for eviction, while the
 * web app's cache entries (which do carry TTLs) stay evictable.
 */
export type Keys = ReturnType<typeof makeKeys>;

export function makeKeys(prefix: string) {
  return {
    prefix,
    jobsPending: `${prefix}:jobs:pending`,
    jobsLeased: `${prefix}:jobs:leased`,
    jobsDead: `${prefix}:jobs:dead`,
    job: (jobId: string) => `${prefix}:job:${jobId}`,
    scanDue: `${prefix}:scan:due`,
    scan: (thesisId: number) => `${prefix}:scan:${thesisId}`,
    watermark: (name: string) => `${prefix}:watermark:${name}`,
    lock: (name: string) => `${prefix}:lock:${name}`,
  };
}

export const DEFAULT_PREFIX = "tezara:crawler";
