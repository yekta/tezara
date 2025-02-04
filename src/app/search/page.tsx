import {
  cachedSearchLikePageSearchParams,
  getSearchThesesQueryKey,
  HITS_PER_PAGE_DEFAULT,
  searchRoute,
} from "@/components/search/constants";
import SearchBox from "@/components/search/search-box/search-box";
import SearchResults from "@/components/search/results/search-results";
import SearchResultsProvider from "@/components/search/results/search-results-provider";
import { getSearchLikePagePrefetchPromises } from "@/lib/queries/search-like-page-prefetch";
import { meili } from "@/server/meili/constants-client";
import { meiliAdmin } from "@/server/meili/constants-server";
import { getLanguages } from "@/server/meili/repo/language";
import { searchTheses } from "@/server/meili/repo/thesis";
import { getThesisTypes } from "@/server/meili/repo/thesis-type";
import { getUniversities } from "@/server/meili/repo/university";
import {
  getQueryClientServer,
  HydrateClient,
} from "@/server/trpc/setup/server";
import { getSubjects } from "@/server/meili/repo/subject";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  const {
    q,
    languages,
    universities,
    departments,
    authors,
    advisors,
    year_gte,
    year_lte,
    thesis_types,
    subjects,
    search_on,
    page,
  } = await cachedSearchLikePageSearchParams.parse(searchParams);

  const queryClient = getQueryClientServer();
  const queryKey = getSearchThesesQueryKey({
    q,
    languages,
    universities,
    departments,
    authors,
    advisors,
    thesis_types,
    subjects,
    year_gte,
    year_lte,
    page,
    search_on,
    hits_per_page: HITS_PER_PAGE_DEFAULT,
    attributes_to_not_retrieve: ["abstract_original", "abstract_translated"],
    attributes_to_retrieve: undefined,
  });

  const start = performance.now();
  const [languagesData, universitiesData, thesisTypesData, subjectsData] =
    await Promise.all([
      getLanguages({ client: meili }),
      getUniversities({ client: meili }),
      getThesisTypes({ client: meili }),
      getSubjects({ client: meili, languages: ["Turkish"] }),
      queryClient.prefetchQuery({
        queryKey,
        queryFn: () =>
          searchTheses({
            q,
            languages,
            universities,
            departments,
            advisors,
            authors,
            thesis_types,
            subjects,
            year_gte,
            year_lte,
            page,
            hits_per_page: HITS_PER_PAGE_DEFAULT,
            sort: undefined,
            attributes_to_not_retrieve: [
              "abstract_original",
              "abstract_translated",
            ],
            search_on,
            attributes_to_retrieve: undefined,
            client: meiliAdmin,
          }),
      }),
      ...getSearchLikePagePrefetchPromises({ queryClient }),
    ]);
  console.log(
    `${searchRoute}:getPageData() | ${Math.round(performance.now() - start)}ms`
  );

  return (
    <HydrateClient>
      <main className="w-full max-w-5xl px-3 md:px-8 flex-1 flex flex-col items-center pb-32">
        <SearchResultsProvider>
          <SearchBox
            languagesData={languagesData.hits}
            universitiesData={universitiesData.hits}
            thesisTypesData={thesisTypesData.hits}
            subjectsData={subjectsData.hits}
            variant="search"
          />
          <SearchResults />
        </SearchResultsProvider>
      </main>
    </HydrateClient>
  );
}
