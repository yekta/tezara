import { generateSitemaps } from "@/app/sitemap";
import { env } from "@/lib/env";

export const revalidate = 3600; // cache for 1 hour

function getFileName(id: number) {
  return `${id}.xml`;
}

function getLoc(id: number) {
  return `${env.NEXT_PUBLIC_SITE_URL}/sitemap/${getFileName(id)}`;
}

function getSitemapString(id: number) {
  return `<sitemap><loc>${getLoc(
    id
  )}</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>`;
}

function getSitemapsString(ids: { id: number }[]) {
  return ids.map(({ id }) => getSitemapString(id)).join("");
}

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${getSitemapsString(await generateSitemaps())}
    </sitemapindex>
  `;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
