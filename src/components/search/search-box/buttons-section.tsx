import { SearchIcon } from "@/components/icons/search-icon";
import { useSearchResults } from "@/components/search/results/search-results-provider";
import ClearFiltersButton from "@/components/search/search-box/clear-filters-button";
import { useSearchLikePageParam } from "@/components/search/query-param-provider";
import { Button } from "@/components/ui/button";
import { useUmami } from "@/lib/hooks/use-umami";
import { ChevronUpIcon, LoaderIcon, SettingsIcon } from "lucide-react";
import { usePostHog } from "posthog-js/react";

type Props = {
  isPendingPush: boolean;
};

export default function ButtonsSection({ isPendingPush }: Props) {
  const [advancedSearch, setAdvancedSearch] = useSearchLikePageParam.advanced();

  const searchResultsContext = useSearchResults();

  const isPendingResults = searchResultsContext
    ? searchResultsContext.isPending
    : false;
  const isFetchingResults = searchResultsContext
    ? searchResultsContext.isFetching
    : false;
  const isPendingOrFetchingResults = isPendingResults || isFetchingResults;

  const umami = useUmami();
  const posthog = usePostHog();

  return (
    <div
      data-advanced={advancedSearch ? true : undefined}
      className="max-w-full flex flex-wrap justify-center items-center gap-2 group"
    >
      <Button
        disabled={isPendingPush || isPendingOrFetchingResults}
        className="py-[calc(0.5rem+1px)] px-5 gap-2"
        fadeOnDisabled={false}
      >
        <div className="size-5 -ml-2.25">
          {isPendingPush || isPendingOrFetchingResults ? (
            <LoaderIcon className="size-full animate-spin" />
          ) : (
            <SearchIcon className="size-full" />
          )}
        </div>
        <p className="shrink min-w-0">Ara</p>
      </Button>
      {/* Filter and clear buttons */}
      <div className="shrink min-w-0 flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="font-semibold py-2 px-3.75"
          onClick={() => {
            if (!advancedSearch) {
              umami.capture("Advance Search Clicked");
              posthog.capture("Advance Search Clicked");
            }
            setAdvancedSearch((a) => !a);
          }}
        >
          <div className="size-5 -ml-1 transform transition group-data-[advanced]:rotate-90">
            {advancedSearch ? (
              <ChevronUpIcon className="size-full -rotate-90" />
            ) : (
              <SettingsIcon className="size-full" />
            )}
          </div>
          <p className="shrink min-w-0">Filtrele</p>
        </Button>
        <ClearFiltersButton />
      </div>
    </div>
  );
}
