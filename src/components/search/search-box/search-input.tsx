import { SearchIcon } from "@/components/icons/search-icon";
import {
  searchLikePageParamKeys,
  searchLikePageParamParsers,
} from "@/components/search/constants";
import { useSearchResults } from "@/components/search/results/search-results-provider";
import {
  focusToMainInput,
  mainSearchInputId,
} from "@/components/search/search-box/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import { useUmami } from "@/lib/hooks/use-umami";
import { LoaderIcon, XIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

type Props = {
  className?: string;
  variant: "home" | "search";
  isPendingPush: boolean;
};

export default function SearchInput({
  className,
  variant,
  isPendingPush,
}: Props) {
  const [query, setQuery] = useQueryState(
    searchLikePageParamKeys.q,
    searchLikePageParamParsers.q
  );
  const debouncedSetQueryQP = useDebounceCallback(setQuery, 150);
  const [queryInputValue, setQueryInputValue] = useState(query);

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

  const captureSearch = useCallback(
    (query: string, variant: Props["variant"]) => {
      if (!query) return;
      umami.capture("Searched", {
        Query: query,
        Variant: variant,
      });
      posthog.capture("Searched", {
        Query: query,
        Variant: variant,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const debouncedCaptureSearch = useDebounceCallback(captureSearch, 4000);

  useEffect(() => {
    if (variant === "home") {
      if (!queryInputValue) {
        setQuery("");
        return;
      }
      debouncedSetQueryQP(queryInputValue);
      return;
    }

    if (!queryInputValue) {
      setQuery("");
      return;
    }
    debouncedSetQueryQP(queryInputValue);
    debouncedCaptureSearch(queryInputValue, variant);

    // This is a stable function, no need to add it to deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInputValue]);

  function clearQuery() {
    setQueryInputValue("");
    setQuery("");
  }

  return (
    <div className={cn("relative group/input w-144 max-w-full", className)}>
      <div className="size-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-more-foreground">
        {isPendingPush || isPendingOrFetchingResults ? (
          <LoaderIcon className="size-full animate-spin" />
        ) : (
          <SearchIcon className="size-full" />
        )}
      </div>
      <Input
        name={mainSearchInputId}
        aria-label="Ara"
        fadeOnDisabled={false}
        id={mainSearchInputId}
        type="search"
        enterKeyHint="search"
        disabled={isPendingPush}
        className="w-full pl-8.5 pr-12"
        placeholder="Tez, yazar, veya danışman ara..."
        value={queryInputValue}
        onChange={(e) => setQueryInputValue(e.target.value)}
      />
      {!isPendingPush &&
        queryInputValue !== undefined &&
        queryInputValue !== "" &&
        queryInputValue !== null && (
          <Button
            size="icon"
            aria-label="Aramayı temizle"
            variant="ghost"
            className="absolute size-9 text-muted-foreground right-1 top-1/2 transform -translate-y-1/2"
            type="button"
            onClick={() => {
              clearQuery();
              focusToMainInput();
            }}
          >
            <XIcon className="size-5" />
          </Button>
        )}
    </div>
  );
}
