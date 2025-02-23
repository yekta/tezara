import { subjectsRoute } from "@/app/subjects/_components/constants";
import { cachedSubjectsPageSearchParams } from "@/app/subjects/_components/constants";
import { SubjectsPageQueryParamProvider } from "@/app/subjects/_components/query-param-provider";
import SearchInput from "@/app/subjects/_components/search-input";
import SubjectsCardsGrid from "@/app/subjects/_components/subjects-cards-grid";
import SubjectsCountChip from "@/app/subjects/_components/subjects-count-chip";
import SubjectsPageProvider from "@/app/subjects/_components/subjects-page-provider";
import SubjectsPaginationBar from "@/app/subjects/_components/subjects-pagination-bar";
import { siteTitle } from "@/lib/constants";
import { getTwitterMeta } from "@/lib/helpers";
import { apiServer, HydrateClient } from "@/server/trpc/setup/server";
import { Metadata } from "next";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  const { page, q } = await cachedSubjectsPageSearchParams.parse(searchParams);
  const start = performance.now();
  await apiServer.main.getSubjects.prefetch({
    page,
    q,
  });
  console.log(
    `${subjectsRoute}:getSubjects(${page}) | ${Math.round(
      performance.now() - start
    )}ms`
  );

  return (
    <HydrateClient>
      <SubjectsPageQueryParamProvider>
        <SubjectsPageProvider>
          <main className="w-full shrink min-w-0 max-w-5xl flex flex-col flex-1 content-start pt-2 md:px-8 pb-32">
            {/* Title and search bar */}
            <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div className="w-full sm:w-1/2 flex flex-wrap items-center gap-1.5 px-4">
                <h1 className="shrink min-w-0 font-bold text-3xl text-balance leading-tight pr-1">
                  Konular
                </h1>
                <SubjectsCountChip />
              </div>
              <div className="pt-4 sm:pt-0 flex-1 sm:max-w-[50%] lg:max-w-[33.3333%] min-w-0 flex justify-end px-2 sm:pl-1 lg:pl-0 pr-2">
                <SearchInput />
              </div>
            </div>
            <div className="w-full px-2 pt-2 sm:pt-4">
              <SubjectsPaginationBar className="px-1.5" />
            </div>
            <SubjectsCardsGrid />
            <div className="w-full px-2">
              <SubjectsPaginationBar hideWhenSinglePage className="px-1.5" />
            </div>
          </main>
        </SubjectsPageProvider>
      </SubjectsPageQueryParamProvider>
    </HydrateClient>
  );
}

const title = `Konular | ${siteTitle}`;
const description =
  "Tezlerde kullanılan konuların istatistiklerini görüntüle. Bu konulardaki tezlerin yıllara göre dağılımı, tezlerde kullanılan diller ve tez türleri gibi verilere ulaş.";

export const metadata: Metadata = {
  title,
  description,
  twitter: getTwitterMeta({
    title,
    description,
    addImages: true,
  }),
};
