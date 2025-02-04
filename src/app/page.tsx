import Logo from "@/components/logo/logo";
import { cachedSearchLikePageSearchParams } from "@/components/search/constants";
import SearchBox from "@/components/search/search-box/search-box";
import { getSearchLikePagePrefetchPromises } from "@/lib/queries/search-like-page-prefetch";
import { meili } from "@/server/meili/constants-client";
import { searchAdvisors } from "@/server/meili/repo/advisor";
import { getLanguages } from "@/server/meili/repo/language";
import { getSubjects } from "@/server/meili/repo/subject";
import { getThesisTypes } from "@/server/meili/repo/thesis-type";
import { getUniversities } from "@/server/meili/repo/university";
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
  const [languages, universities, thesisTypes, subjects] = await Promise.all([
    getLanguages({ client: meili }),
    getUniversities({ client: meili }),
    getThesisTypes({ client: meili }),
    getSubjects({ client: meili, languages: ["Turkish"] }),
    queryClient.prefetchQuery({
      queryKey: ["advisors", undefined],
      queryFn: () =>
        searchAdvisors({
          q: "",
          page: 1,
          sort: undefined,
          client: meili,
        }),
    }),
    ...getSearchLikePagePrefetchPromises({ queryClient }),
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
            languagesData={languages.hits}
            universitiesData={universities.hits}
            thesisTypesData={thesisTypes.hits}
            subjectsData={subjects.hits}
            className="mt-6"
            variant="home"
          />
        </div>
      </main>
    </HydrateClient>
  );
}
