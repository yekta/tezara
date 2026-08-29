import { env } from "@/lib/env";

export const siteTitle = "Tezara";
export const siteTagline = "Tez Arama ve Metaveri Analizi Platformu";
export const siteDescription =
  "Tezara, YÖK Ulusal Tez Merkezi'ne girilen tezler üzerinden arama ve metaveri analizi yapmanızı sağlar. Yazar, başlık, özet, danışman, yıl, üniversite ve dil gibi verilere ulaşabilir, bu verileri tablo ya da grafiğe dönüştürebilirsiniz.";
export const staticAssetsRoute = "/static";

export const previewImages = {
  path: `${staticAssetsRoute}/previews`,
  version: "v4",
};

export const getPreviewUrl = (slug: string) =>
  `${env.NEXT_PUBLIC_SITE_URL}${previewImages.path}/${previewImages.version}/${slug}.png`;

export const TURKISH = "Türkçe";

/**
 * Floor for anything that treats a thesis year as a real year.
 *
 * A handful of theses reach ClickHouse with `year = 0`: YÖK's list page omits the metadata
 * blob for them, so the crawler stores a null year and the non-nullable `year UInt32` column
 * coerces it to zero. The oldest genuine thesis in the corpus is from 1959, so a value under
 * this floor is always bad data — and leaving even one in stretches a per-year chart's
 * category axis across two thousand empty years.
 */
export const earliestThesisYear = 1950;

export type TScOption = "x" | "github" | "buymeacoffee";

export const sc: Record<
  TScOption,
  {
    name: string;
    href: string;
    slug: TScOption;
    joinable: boolean;
    xOrder: number;
  }
> = {
  buymeacoffee: {
    name: "Bağış Yap",
    href: "https://buymeacoffee.com/yekta?ref=tezara.org",
    slug: "buymeacoffee",
    joinable: true,
    xOrder: 1,
  },
  x: {
    name: "X (Twitter)",
    href: "https://x.com/yektagg",
    slug: "x",
    joinable: true,
    xOrder: 1,
  },
  github: {
    name: "GitHub",
    href: "https://github.com/yekta/tezara",
    slug: "github",
    joinable: true,
    xOrder: 2,
  },
};
