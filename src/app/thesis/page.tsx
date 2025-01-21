import { siteTitle } from "@/lib/constants";
import { getTwitterMeta } from "@/lib/helpers";
import { Metadata } from "next";

export default async function Page() {
  return <div>Tezler</div>;
}

const title = `Tezler | ${siteTitle}`;
const description =
  "YÖK Ulusal Tez Merkezi'ne yüklenen tezleri görüntüle. Yazar, başlık, özet, danışman, yıl, üniversite ve dil gibi alanlar üzerinden arama yap. Bu verileri tablo ya da grafiğe dönüştür.";

export const metadata: Metadata = {
  title,
  description,
  twitter: getTwitterMeta({
    title,
    description,
  }),
};
