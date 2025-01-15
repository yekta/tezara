import SearchBox from "@/components/search/search-input";
import { searchPageSearchParamsCache } from "@/components/search/search-query-params";
import SearchResults from "@/components/search/search-results";
import SearchResultsProvider from "@/components/search/search-results-provider";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  await searchPageSearchParamsCache.parse(searchParams);
  return (
    <div className="w-full flex-1 flex flex-col items-center">
      <div className="w-full max-w-5xl px-4 md:px-8 flex-1 flex flex-col items-center pb-[calc(6vh+6rem)]">
        <div className="w-full flex flex-col items-center">
          <SearchResultsProvider>
            <SearchBox variant="search" />
            <SearchResults />
          </SearchResultsProvider>
        </div>
      </div>
    </div>
  );
}
