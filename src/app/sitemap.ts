import { subjectsRoute } from "@/app/subjects/_components/constants";
import { universitiesRoute } from "@/app/universities/_components/constants";
import { searchRoute } from "@/components/search/constants";
import type { MetadataRoute } from "next";
import { env } from "process";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: `${env.NEXT_PUBLIC_SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${env.NEXT_PUBLIC_SITE_URL}${searchRoute}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${env.NEXT_PUBLIC_SITE_URL}${universitiesRoute}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${env.NEXT_PUBLIC_SITE_URL}${subjectsRoute}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    /* ,
    {
      url: `${env.NEXT_PUBLIC_SITE_URL}/thesis`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    }, */
  ];
}
