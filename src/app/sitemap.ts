import { env } from "@/lib/env";
import { meiliAdmin } from "@/server/meili/constants-server";
import { searchTheses } from "@/server/meili/repo/thesis";
import { getUniversities } from "@/server/meili/repo/university";
import type { MetadataRoute } from "next";

const SITEMAP_ENTRIES_PER_PAGE = 5_000;
const main: MetadataRoute.Sitemap = [
  {
    url: `${env.NEXT_PUBLIC_SITE_URL}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  },
  {
    url: `${env.NEXT_PUBLIC_SITE_URL}/search`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  },
  /* {
    url: `${env.NEXT_PUBLIC_SITE_URL}/university`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  },
  {
    url: `${env.NEXT_PUBLIC_SITE_URL}/thesis`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  }, */
];

export async function generateSitemaps() {
  const data = await getTheses({ page: 1 });
  const arr = Array.from({ length: data.totalPages + 1 }, (_, i) => i);
  return [...arr.map((i) => ({ id: i }))];
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const idNumber = Number(id);
  if (idNumber === 0) {
    const data = await getUniversities({ client: meiliAdmin });
    const universities: MetadataRoute.Sitemap = data.hits.map((u) => ({
      url: `${env.NEXT_PUBLIC_SITE_URL}/university/${encodeURIComponent(
        u.name
      )}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    }));
    const all: MetadataRoute.Sitemap = [...main, ...universities];
    return all;
  }

  const data = await getTheses({ page: idNumber });

  const theses: MetadataRoute.Sitemap = data.hits.map((t) => ({
    url: `${env.NEXT_PUBLIC_SITE_URL}/thesis/${t.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  }));

  return [...theses];
}

async function getTheses({ page }: { page: number }) {
  const data = await searchTheses({
    q: "",
    page,
    hits_per_page: SITEMAP_ENTRIES_PER_PAGE,
    advisors: [],
    authors: [],
    universities: [],
    departments: [],
    languages: [],
    sort: undefined,
    thesis_types: [],
    year_gte: null,
    year_lte: null,
    attributes_to_retrieve: ["id"],
    client: meiliAdmin,
  });
  return data;
}
