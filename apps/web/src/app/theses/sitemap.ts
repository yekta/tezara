import { thesesRoute } from "@/app/theses/_components/constants";
import { env } from "@/lib/env";
import { meiliAdmin } from "@/server/meili/constants-server";
import { sitemapFetch } from "@/server/meili/sitemap-fetch";
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

const indexName = "theses";
const index = () => meiliAdmin.index<{ id: number }>(indexName);

export async function generateSitemaps() {
  const { hits } = await sitemapFetch("theses index", () =>
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
  const { results } = await sitemapFetch(`theses ${from}-${to}`, () =>
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
