import { thesesRoute } from "@/app/theses/_components/constants";
import { env } from "@/lib/env";
import { meiliAdmin } from "@/server/meili/constants-server";
import { MetadataRoute } from "next";

const SITEMAP_ENTRIES_PER_PAGE = 5_000;
const indexName = "theses";

/**
 * Walks the corpus through the documents endpoint rather than search. Search is capped
 * by the index's `maxTotalHits` (20k, kept low so interactive queries stay fast), which
 * would silently truncate a ~1M-thesis sitemap; `getDocuments` pages by offset over the
 * whole index and reports the true total.
 */
export async function generateSitemaps() {
  const { total } = await getThesisIds({ page: 1 });
  const pages = Math.ceil(total / SITEMAP_ENTRIES_PER_PAGE);
  return Array.from({ length: pages }, (_, i) => ({ id: i + 1 }));
}

/**
 * Since Next 15 `id` arrives as a Promise of the string segment, not the number
 * `generateSitemaps` returned. The previous `Number(id)` on the promise was NaN, which
 * Meili's search silently treated as page 1 — every sitemap served the same 5k theses.
 */
export default async function sitemap({
  id,
}: {
  id: Promise<string> | string | number;
}): Promise<MetadataRoute.Sitemap> {
  const page = Number.parseInt(String(await id), 10);
  if (!Number.isInteger(page) || page < 1) {
    throw new Error(`theses sitemap: invalid id ${JSON.stringify(await id)}`);
  }
  const { results } = await getThesisIds({ page });

  return results.map((t) => ({
    url: `${env.NEXT_PUBLIC_SITE_URL}${thesesRoute}/${t.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  }));
}

async function getThesisIds({ page }: { page: number }) {
  return meiliAdmin.index<{ id: number }>(indexName).getDocuments({
    fields: ["id"],
    limit: SITEMAP_ENTRIES_PER_PAGE,
    offset: (page - 1) * SITEMAP_ENTRIES_PER_PAGE,
  });
}
