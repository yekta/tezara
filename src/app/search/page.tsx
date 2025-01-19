import { loadSearchLikePageSearchParams } from "@/components/search/constants/server";
import { LIMIT_DEFAULT } from "@/components/search/constants/shared";
import { getSearchThesesQueryKey } from "@/components/search/helpers";
import SearchBox from "@/components/search/search-box";
import { searchPageSearchParamsCache } from "@/components/search/search-query-params";
import SearchResults from "@/components/search/search-results";
import SearchResultsProvider from "@/components/search/search-results-provider";
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

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  await searchPageSearchParamsCache.parse(searchParams);
  const { q, offset, languages, thesis_types, universities } =
    await loadSearchLikePageSearchParams(searchParams);

  const queryClient = getQueryClientServer();
  const queryKey = getSearchThesesQueryKey({
    query: q,
    languages,
    universities,
    thesisTypes: thesis_types,
    limit: LIMIT_DEFAULT,
    offset,
  });

  const [languagesData, universitiesData, thesisTypesData] = await Promise.all([
    getLanguages({ client: meili }),
    getUniversities({ client: meili }),
    getThesisTypes({ client: meili }),
    queryClient.prefetchQuery({
      queryKey,
      queryFn: () =>
        searchTheses({
          client: meiliAdmin,
          query: q,
          languages,
          universities,
          thesisTypes: thesis_types,
          offset: offset,
          limit: LIMIT_DEFAULT,
        }),
    }),
  ]);

  return (
    <HydrateClient>
      <div className="w-full flex-1 flex flex-col items-center">
        <div className="w-full max-w-5xl px-3 md:px-8 flex-1 flex flex-col items-center pb-[calc(6vh+6rem)]">
          <div className="w-full flex flex-col items-center">
            <SearchResultsProvider>
              <SearchBox
                languages={languagesData.hits}
                universities={universitiesData.hits}
                thesisTypes={thesisTypesData.hits}
                variant="search"
              />
              <SearchResults />
            </SearchResultsProvider>
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
