import "server-only";

const MAX_CONCURRENT_FETCHES = 4;
const RETRIES = 5;

let active = 0;
const waiting: (() => void)[] = [];

// A woken waiter inherits the finishing call's slot, so a new caller can't slip in between.
async function withLimit<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT_FETCHES) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  } else {
    active++;
  }
  try {
    return await fn();
  } finally {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
}

/**
 * Sitemaps are prerendered at build time, where a single Meili timeout fails the whole
 * build. Run a few at a time and wait out a briefly busy instance instead.
 */
export async function sitemapFetch<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      return await withLimit(fn);
    } catch (error) {
      lastError = error;
      if (attempt < RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
      }
    }
  }
  throw new Error(`sitemap: ${label} failed after ${RETRIES} attempts`, {
    cause: lastError,
  });
}
