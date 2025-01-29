import { cachedUniversitiesPageSearchParams } from "@/app/universities/_components/constants";
import { UniversitiesPageQueryParamProvider } from "@/app/universities/_components/query-param-provider";
import SearchInput from "@/app/universities/_components/search-input";
import UniversitiesCardsGrid from "@/app/universities/_components/universities-cards-grid";
import UniversitiesCountChip from "@/app/universities/_components/universities-count-chip";
import UniversitiesPageProvider from "@/app/universities/_components/universities-page-provider";
import UniversitiesPaginationBar from "@/app/universities/_components/universities-pagination-bar";
import { siteTitle } from "@/lib/constants";
import { getTwitterMeta } from "@/lib/helpers";
import { apiServer, HydrateClient } from "@/server/trpc/setup/server";
import { Metadata } from "next";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  const { page, q } = await cachedUniversitiesPageSearchParams.parse(
    searchParams
  );
  const start = performance.now();
  await apiServer.main.getUniversities.prefetch({
    page,
    q,
  });
  console.log(
    `/universities:getUniversities(${page}) | ${Math.round(
      performance.now() - start
    )}ms`
  );

  return (
    <HydrateClient>
      <UniversitiesPageQueryParamProvider>
        <UniversitiesPageProvider>
          <div className="w-full shrink min-w-0 max-w-5xl flex flex-col flex-1 content-start pt-2 md:px-8 pb-32">
            {/* Title and search bar */}
            <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div className="w-full sm:w-1/2 flex flex-wrap items-center gap-1.5 px-4">
                <h1 className="shrink min-w-0 font-bold text-3xl text-balance leading-tight pr-1">
                  Üniversiteler
                </h1>
                <UniversitiesCountChip className="mt-0.75" />
              </div>
              <div className="pt-4 sm:pt-0 flex-1 sm:max-w-[50%] lg:max-w-[33.3333%] min-w-0 flex justify-end px-2 sm:pl-1 lg:pl-0 pr-2">
                <SearchInput />
              </div>
            </div>
            <div className="w-full px-2 pt-2 sm:pt-4">
              <UniversitiesPaginationBar className="px-1.5" />
            </div>
            <UniversitiesCardsGrid />
            <div className="w-full px-2">
              <UniversitiesPaginationBar className="px-1.5" />
            </div>
          </div>
        </UniversitiesPageProvider>
      </UniversitiesPageQueryParamProvider>
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
