import { meiliAdmin } from "@/server/meili/constants-server";
import { getUniversities } from "@/server/meili/repo/university";
import type { MetadataRoute } from "next";
import { env } from "process";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getUniversities({ client: meiliAdmin });
  const universities: MetadataRoute.Sitemap = data.hits.map((u) => ({
    url: `${env.NEXT_PUBLIC_SITE_URL}/university/${encodeURIComponent(u.name)}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  }));

  return universities;
}
