import SearchBox from "@/components/search/search-input";
import { searchPageSearchParamsCache } from "@/components/search/search-query-params";
import SearchResults from "@/components/search/search-results";
import SearchResultsProvider from "@/components/search/search-results-provider";
import { meili } from "@/server/meili/constants-client";
import { getLanguages } from "@/server/meili/repo/language";
import { getThesisTypes } from "@/server/meili/repo/thesis-type";
import { getUniversities } from "@/server/meili/repo/university";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  await searchPageSearchParamsCache.parse(searchParams);
  const [languages, universities, thesisTypes] = await Promise.all([
    getLanguages({ client: meili }),
    getUniversities({ client: meili }),
    getThesisTypes({ client: meili }),
  ]);

  return (
    <div className="w-full flex-1 flex flex-col items-center">
      <div className="w-full max-w-5xl px-3 md:px-8 flex-1 flex flex-col items-center pb-[calc(6vh+6rem)]">
        <div className="w-full flex flex-col items-center">
          <SearchResultsProvider>
            <SearchBox
              languages={languages.hits}
              universities={universities.hits}
              thesisTypes={thesisTypes.hits}
              variant="search"
            />
            <SearchResults />
          </SearchResultsProvider>
        </div>
      </div>
    </div>
  );
}
