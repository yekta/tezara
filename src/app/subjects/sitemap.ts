import { subjectsRoute } from "@/app/subjects/_components/constants";
import { meiliAdmin } from "@/server/meili/constants-server";
import { getSubjects } from "@/server/meili/repo/subject";
import type { MetadataRoute } from "next";
import { env } from "process";
import { unstable_cacheLife as cacheLife } from "next/cache";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("default");

  const data = await getSubjects({
    languages: ["Turkish"],
    client: meiliAdmin,
  });
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
