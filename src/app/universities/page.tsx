import UniversitiesCardsGrid from "@/app/universities/_components/universities-cards-grid";
import UniversitiesCountChip from "@/app/universities/_components/universities-count-chip";
import UniversitiesPageProvider from "@/app/universities/_components/universities-page-provider";
import UniversitiesPaginationBar from "@/app/universities/_components/universities-pagination-bar";
import { cachedUniversitiesPageSearchParams } from "@/app/universities/constants/server";
import { siteTitle } from "@/lib/constants";
import { getTwitterMeta } from "@/lib/helpers";
import { apiServer, HydrateClient } from "@/server/trpc/setup/server";
import { Metadata } from "next";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  const { page } = await cachedUniversitiesPageSearchParams.parse(searchParams);
  const start = performance.now();
  await apiServer.main.getUniversities.prefetch({
    page,
  });
  console.log(
    `/universities:getUniversities(${page}) | ${Math.round(
      performance.now() - start
    )}ms`
  );

  return (
    <HydrateClient>
      <UniversitiesPageProvider>
        <div className="w-full shrink min-w-0 max-w-5xl flex flex-col flex-1 pt-2 md:px-8 pb-32">
          {/* Title */}
          <div className="w-full flex flex-col px-4">
            <div className="w-full flex items-center flex-wrap gap-1.5">
              <h1 className="shrink min-w-0 font-bold text-3xl text-balance leading-tight pr-1">
                Üniversiteler
              </h1>
              <UniversitiesCountChip />
            </div>
            <div className="w-full flex flex-wrap items-center mt-3 md:mt-2 gap-1.5"></div>
          </div>
          <div className="w-full px-2 pt-1 md:pt-2">
            <UniversitiesPaginationBar className="px-1.5" />
          </div>
          <UniversitiesCardsGrid />
          <div className="w-full px-2">
            <UniversitiesPaginationBar className="px-1.5" />
          </div>
        </div>
      </UniversitiesPageProvider>
    </HydrateClient>
  );
}

const title = `Üniversiteler | ${siteTitle}`;
const description =
  "YÖK'e bağlı üniversitelerin tez istatistiklerini görüntüle. Yıllara göre tez sayıları, popüler tez konuları, tezlerde kullanılan diller ve tez türleri gibi verilere ulaş.";

export const metadata: Metadata = {
  title,
  description,
  twitter: getTwitterMeta({
    title,
    description,
  }),
};
