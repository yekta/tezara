import { env } from "@/lib/env";

export const siteTitle = "Tezara";
export const siteTagline = "Tez metaveri analizi";
export const siteDescription =
  "Tezara, YÖK'ün Ulusal Tez Merkezi'ne girilen tezlerin metaveri analizlerini yapmanızı sağlar.";

export const previewImages = {
  path: "previews",
  version: "v1",
};

export const getPreviewUrl = (slug: string) =>
  `${env.NEXT_PUBLIC_SITE_URL}/${previewImages.path}/${previewImages.version}/${slug}.png`;
