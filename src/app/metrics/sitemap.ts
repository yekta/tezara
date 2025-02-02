import { universitiesRoute } from "@/app/universities/_components/constants";
import { meiliAdmin } from "@/server/meili/constants-server";
import { getUniversities } from "@/server/meili/repo/university";
import type { MetadataRoute } from "next";
import { env } from "process";
import { unstable_cacheLife as cacheLife } from "next/cache";
import { cacheConfig } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife(cacheConfig.longer);

  const data = await getUniversities({ client: meiliAdmin });
  const universities: MetadataRoute.Sitemap = data.hits.map((u) => ({
    url: `${env.NEXT_PUBLIC_SITE_URL}${universitiesRoute}/${encodeURIComponent(
      u.name
    )}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  }));

  return universities;
}
