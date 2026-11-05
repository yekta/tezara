import { subjectsRoute } from "@/app/subjects/_components/constants";
import { meiliAdmin } from "@/server/meili/constants-server";
import { sitemapFetch } from "@/server/meili/sitemap-fetch";
import { getSubjects } from "@/server/meili/repo/subject";
import type { MetadataRoute } from "next";
import { env } from "process";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await sitemapFetch("subjects", () =>
    getSubjects({
      languages: ["Turkish"],
      client: meiliAdmin,
    })
  );
  const subjects: MetadataRoute.Sitemap = data.hits.map((u) => ({
    url: `${env.NEXT_PUBLIC_SITE_URL}${subjectsRoute}/${encodeURIComponent(
      u.name
    )}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  }));

  return subjects;
}
