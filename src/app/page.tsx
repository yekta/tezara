import Logo from "@/components/logo/logo";
import { cachedSearchLikePageSearchParams } from "@/components/search/constants";
import SearchBox from "@/components/search/search-box/search-box";
import { getSearchLikePageData } from "@/lib/queries/search-like-page-data";
import { prefetchSearchLikePage } from "@/lib/queries/search-like-page-prefetch";
import {
  getQueryClientServer,
  HydrateClient,
} from "@/server/trpc/setup/server";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: Props) {
  await cachedSearchLikePageSearchParams.parse(searchParams);
  const queryClient = getQueryClientServer();

  const start = performance.now();
  const [{ languagesData, universitiesData, thesisTypesData, subjectsData }] =
    await Promise.all([
      getSearchLikePageData(),
      prefetchSearchLikePage({ queryClient }),
    ]);
  console.log(`/:getPageData() | ${Math.round(performance.now() - start)}ms`);

  return (
    <HydrateClient>
      <main className="w-full max-w-7xl px-3 md:px-8 flex-1 flex flex-col justify-center items-center pt-4 pb-[calc(10vh+5rem)] sm:pb-[calc(11vh+6rem)]">
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex items-center justify-center px-4">
            <Logo variant="full" className="w-32 max-w-full h-auto" />
          </div>
          <SearchBox
            languagesData={languagesData.hits}
            universitiesData={universitiesData.hits}
            thesisTypesData={thesisTypesData.hits}
            subjectsData={subjectsData.hits}
            className="mt-6"
            variant="home"
          />
        </div>
      </main>
    </HydrateClient>
  );
}
