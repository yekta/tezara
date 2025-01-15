import SearchResultsProvider from "@/components/providers/search-results-provider";
import SearchBox from "@/components/search/search-input";
import SearchResults from "@/components/search/search-results";

export default async function Page() {
  return (
    <SearchResultsProvider>
      <div className="w-full flex-1 flex flex-col items-center">
        <div className="w-full max-w-7xl px-4 md:px-8 flex-1 flex flex-col items-center pb-[calc(6vh+2rem)]">
          <div className="w-full flex flex-col items-center">
            <SearchBox variant="search" />
            <SearchResults />
          </div>
        </div>
      </div>
    </SearchResultsProvider>
  );
}
