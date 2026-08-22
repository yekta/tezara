import {
  cachedSearchLikePageSearchParams,
  getSearchThesesQueryKey,
  HITS_PER_PAGE_DEFAULT,
  searchRoute,
} from "@/components/search/constants";
import SearchResults from "@/components/search/results/search-results";
import SearchResultsProvider from "@/components/search/results/search-results-provider";
import SearchBox from "@/components/search/search-box/search-box";
import { getSearchLikePageData } from "@/lib/queries/search-like-page-data";
import { prefetchSearchLikePage } from "@/lib/queries/search-like-page-prefetch";
import { meiliAdmin } from "@/server/meili/constants-server";
import { searchTheses } from "@/server/meili/repo/thesis";
import {
  getQueryClientServer,
  HydrateClient,
} from "@/server/trpc/setup/server";

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
  const [{ languagesData, universitiesData, thesisTypesData, subjectsData }] =
    await Promise.all([
      getSearchLikePageData(),
      prefetchSearchLikePage({ queryClient }),
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
