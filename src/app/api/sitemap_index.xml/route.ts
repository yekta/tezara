import { generateSitemaps as generateThesisSitemaps } from "@/app/thesis/sitemap";
import { env } from "@/lib/env";

export const revalidate = 3600; // cache for 1 hour

function getFileName(id: string | number) {
  return `${id}.xml`;
}

function getLoc(id: string | number, dir: string) {
  return `${env.NEXT_PUBLIC_SITE_URL}${dir === "/" ? "" : dir}/${getFileName(
    id
  )}`;
}

function getSitemapString(id: string | number, dir: string) {
  return `<sitemap><loc>${getLoc(
    id,
    dir
  )}</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>`;
}

function getSitemapsString(ids: { id: string | number }[], dir: string) {
  return ids.map(({ id }) => getSitemapString(id, dir)).join("");
}

export async function GET() {
  const thesisSitemaps = await generateThesisSitemaps();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${getSitemapString("sitemap", "/")}
      ${getSitemapString("sitemap", "/university")}
      ${getSitemapsString(thesisSitemaps, "/thesis/sitemap")}
    </sitemapindex>
  `;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
