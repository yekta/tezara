import { env } from "@/lib/env";

export const siteTitle = "Tezara";
export const siteTagline = "Tez Arama ve Metaveri Analizi Aracı";
export const siteDescription =
  "Tezara, YÖK Ulusal Tez Merkezi'ne girilen tezler üzerinden arama ve metaveri analizi yapmanızı sağlar. Yazar, başlık, özet, danışman, yıl, üniversite ve dil gibi verilere ulaşabilir, bu verileri tablo ya da grafiğe dönüştürebilirsiniz.";

export const previewImages = {
  path: "previews",
  version: "v3",
};

export const getPreviewUrl = (slug: string) =>
  `${env.NEXT_PUBLIC_SITE_URL}/${previewImages.path}/${previewImages.version}/${slug}.png`;

export const TURKISH = "Türkçe";
