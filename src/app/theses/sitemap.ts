import { thesesRoute } from "@/app/theses/_components/constants";
import { env } from "@/lib/env";
import { meiliAdmin } from "@/server/meili/constants-server";
import { searchTheses } from "@/server/meili/repo/thesis";
import { MetadataRoute } from "next";

export const revalidate = 3600;

const SITEMAP_ENTRIES_PER_PAGE = 5_000;

export async function generateSitemaps() {
  const data = await getTheses({ page: 1 });
  const arr = Array.from({ length: data.totalPages }, (_, i) => i);
  return [...arr.map((i) => ({ id: i + 1 }))];
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const idNumber = Number(id);
  const data = await getTheses({ page: idNumber });

  const theses: MetadataRoute.Sitemap = data.hits.map((t) => ({
    url: `${env.NEXT_PUBLIC_SITE_URL}${thesesRoute}/${t.id}`,
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
    subjects: [],
    sort: undefined,
    thesis_types: [],
    year_gte: null,
    year_lte: null,
    search_on: [],
    attributes_to_retrieve: ["id"],
    attributes_to_not_retrieve: undefined,
    client: meiliAdmin,
  });
  return data;
}
