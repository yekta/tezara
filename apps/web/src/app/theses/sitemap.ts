import { thesesRoute } from "@/app/theses/_components/constants";
import { env } from "@/lib/env";
import { meiliAdmin } from "@/server/meili/constants-server";
import { MetadataRoute } from "next";

/**
 * Each sitemap covers a contiguous range of thesis ids, not a page of results.
 *
 * Ranges rather than `offset` because the crawler keeps writing while the site builds:
 * offsets shift under concurrent inserts, so the same thesis can land in two sitemaps
 * while another is missed entirely. An id range is stable no matter what else is being
 * indexed. (Deep offsets are not themselves slow — measured flat from 0 to 115k — so
 * this is a correctness fix, not a speed one. The speed lever is the limit below.)
 *
 * Requires `id` to be filterable on the theses index (packages/meili/src/indexes.ts).
 */
const IDS_PER_SITEMAP = 5_000;

/**
 * Meili reads every matching document off disk to project it, even though we ask only
 * for `id` — measured at ~29MB of stored data per 5,000 theses. Next prerenders every
 * sitemap concurrently, so unbounded that is gigabytes of reads in flight at once and
 * the 15s client timeout trips against an instance that is also busy indexing. Sitemaps
 * are not latency-sensitive; a few at a time costs the build seconds and removes the
 * pile-up entirely.
 */
const MAX_CONCURRENT_FETCHES = 4;
const RETRIES = 3;

const indexName = "theses";
const index = () => meiliAdmin.index<{ id: number }>(indexName);

let active = 0;
const waiting: (() => void)[] = [];

async function withLimit<T>(fn: () => Promise<T>): Promise<T> {
  // A waiter inherits the finishing call's slot rather than claiming its own. Releasing
  // the slot and letting the woken waiter re-increment would let a caller arriving in
  // between take the same slot, putting MAX_CONCURRENT_FETCHES + 1 requests in flight.
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
 * A timeout here fails the whole build, and the instance being briefly too busy to
 * answer is a transient worth waiting out rather than a reason to ship no sitemaps.
 */
async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
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
  throw new Error(`theses sitemap: ${label} failed after ${RETRIES} attempts`, {
    cause: lastError,
  });
}

export async function generateSitemaps() {
  const { hits } = await withRetry("generateSitemaps", () =>
    index().search("", {
      sort: ["id:desc"],
      limit: 1,
      attributesToRetrieve: ["id"],
    })
  );
  const maxId = hits[0]?.id ?? 0;
  const count = Math.ceil((maxId + 1) / IDS_PER_SITEMAP);
  return Array.from({ length: count }, (_, i) => ({ id: i + 1 }));
}

/**
 * Since Next 15 `id` arrives as a Promise of the string segment, not the number
 * `generateSitemaps` returned. `Number(id)` on the promise was NaN, which Meili's search
 * silently treated as page 1 — every sitemap served the same first 5k theses.
 */
export default async function sitemap({
  id,
}: {
  id: Promise<string> | string | number;
}): Promise<MetadataRoute.Sitemap> {
  const n = Number.parseInt(String(await id), 10);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`theses sitemap: invalid id ${JSON.stringify(await id)}`);
  }

  const from = (n - 1) * IDS_PER_SITEMAP;
  const to = n * IDS_PER_SITEMAP;
  const { results } = await withRetry(`range ${from}-${to}`, () =>
    index().getDocuments({
      filter: `id >= ${from} AND id < ${to}`,
      fields: ["id"],
      limit: IDS_PER_SITEMAP,
    })
  );

  return results.map((t) => ({
    url: `${env.NEXT_PUBLIC_SITE_URL}${thesesRoute}/${t.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  }));
}
