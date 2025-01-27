"use client";

import { useIsTouchscreen } from "@/components/providers/is-touchscreen-provider";
import {
  searchLikePageParamKeys,
  searchLikePageParamParsers,
} from "@/components/search/constants";
import { useSearchResults } from "@/components/search/results/search-results-provider";
import ClearFiltersButton from "@/components/search/search-box/clear-filters-button";
import AdvisorsField from "@/components/search/search-box/fields/advisors";
import AuthorsField from "@/components/search/search-box/fields/authors";
import DepartmentsField from "@/components/search/search-box/fields/departments";
import LanguagesField from "@/components/search/search-box/fields/languages";
import SearchOnField from "@/components/search/search-box/fields/search-on";
import ThesisTypesField from "@/components/search/search-box/fields/thesis-types";
import UniversitiesField from "@/components/search/search-box/fields/universities";
import YearsField from "@/components/search/search-box/fields/years";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import { useAsyncRouterPush } from "@/lib/hooks/use-async-router-push";
import { useUmami } from "@/lib/hooks/use-umami";
import { TGetLanguagesResult } from "@/server/meili/repo/language";
import { TGetThesisTypesResult } from "@/server/meili/repo/thesis-type";
import { TGetUniversitiesResult } from "@/server/meili/repo/university";
import {
  ChevronUpIcon,
  LoaderIcon,
  SearchIcon,
  SettingsIcon,
  XIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useDebounceCallback } from "usehooks-ts";

type Props = {
  className?: string;
  variant: "home" | "search";
  universitiesData: TGetUniversitiesResult["hits"];
  languagesData: TGetLanguagesResult["hits"];
  thesisTypesData: TGetThesisTypesResult["hits"];
};

export default function SearchBox({
  languagesData,
  universitiesData,
  thesisTypesData,
  className,
  variant,
}: Props) {
  const umami = useUmami();
  const posthog = usePostHog();

  const [asyncPush, isPendingAsyncPush] = useAsyncRouterPush();
  const [isPendingHackyPush, setIsPendingHackyPush] = useState(false);
  const isPendingPush = isPendingAsyncPush || isPendingHackyPush;
  const searchResultsContext = useSearchResults();
  const searchParams = useSearchParams();

  const [queryQP, setQueryQP] = useQueryState(
    searchLikePageParamKeys.q,
    searchLikePageParamParsers.q
  );
  const debouncedSetQueryQP = useDebounceCallback(setQueryQP, 150);
  const [queryInputValue, setQueryInputValue] = useState(queryQP);

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
        setQueryQP("");
        return;
      }
      debouncedSetQueryQP(queryInputValue);
      return;
    }

    if (!queryInputValue) {
      setQueryQP("");
      return;
    }
    debouncedSetQueryQP(queryInputValue);
    debouncedCaptureSearch(queryInputValue, variant);

    // This is a stable function, no need to add it to deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInputValue]);

  const [advancedSearchQP, setAdvancedSearchQP] = useQueryState(
    "advanced",
    searchLikePageParamParsers["advanced"]
  );

  useHotkeys("mod+k", () => {
    focusToMainInput();
  });

  const searchRoute = "/search";

  const pushToSearch = async () => {
    const params = new URLSearchParams(searchParams);
    params.set("q", queryInputValue);
    const paramStr = params.toString();
    await asyncPush(`${searchRoute}${paramStr ? `?${paramStr}` : ""}`);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPendingHackyPush(true);
    try {
      if (variant === "home") {
        umami.capture("Searched", {
          Query: queryQP,
          Variant: variant,
        });
        posthog.capture("Searched", {
          Query: queryQP,
          Variant: variant,
        });
        await pushToSearch();

        let counter = 20;
        let pathname = window.location.pathname;

        // TO-DO: Fix this, it is a horrible hack for Safari caused by search params not updating
        while (
          counter > 0 &&
          (pathname !== searchRoute || !pathname.startsWith(searchRoute)) &&
          !isPendingAsyncPush
        ) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          pathname = window.location.pathname;
          if (pathname === searchRoute) return;
          await pushToSearch();
          counter--;
        }
      }
    } catch (error) {
      console.log(error);
    }
    setIsPendingHackyPush(false);
  }

  function clearQuery() {
    setQueryInputValue("");
    setQueryQP("");
  }

  const isTouchScreen = useIsTouchscreen();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isTouchScreen) return;
      if (window.location.hash) {
        const id = window.location.hash.slice(1);
        const el = document.getElementById(id);
        if (el) return;
      }
      focusToMainInput();
    });
    return () => clearTimeout(timeoutId);
  }, [isTouchScreen]);

  function focusToMainInput() {
    document.getElementById("main-search-input")?.focus();
    const input = document.getElementById(
      "main-search-input"
    ) as HTMLInputElement | null;
    input?.setSelectionRange(input.value.length, input.value.length);
  }

  const isPendingResults = searchResultsContext
    ? searchResultsContext.isPending
    : false;
  const isFetchingResults = searchResultsContext
    ? searchResultsContext.isFetching
    : false;
  const isPendingOrFetchingResults = isPendingResults || isFetchingResults;

  return (
    <form
      onSubmit={onSubmit}
      className={cn("w-full group/form flex flex-col items-center", className)}
    >
      <div className="relative group/input w-144 max-w-full">
        <div className="size-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-more-foreground">
          {isPendingPush || isPendingOrFetchingResults ? (
            <LoaderIcon className="size-full animate-spin" />
          ) : (
            <SearchIcon className="size-full" />
          )}
        </div>
        <Input
          aria-label="Ara"
          fadeOnDisabled={false}
          id="main-search-input"
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
      <div
        data-advanced={advancedSearchQP ? true : undefined}
        className="w-full flex flex-col items-center group pt-3"
      >
        <div className="max-w-full flex flex-wrap justify-center items-center gap-2">
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
                if (!advancedSearchQP) {
                  umami.capture("Advance Search Clicked");
                  posthog.capture("Advance Search Clicked");
                }
                setAdvancedSearchQP((a) => !a);
              }}
            >
              <div className="size-5 -ml-1 transform transition group-data-[advanced]:rotate-90">
                {advancedSearchQP ? (
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
        {/* Advanced settings */}
        {advancedSearchQP && (
          <div className="w-full max-w-3xl flex justify-center flex-wrap pt-2">
            <FieldWrapper>
              <SearchOnField />
            </FieldWrapper>
            <FieldWrapper>
              <YearsField />
            </FieldWrapper>
            <FieldWrapper>
              <UniversitiesField universitiesData={universitiesData} />
            </FieldWrapper>
            <FieldWrapper>
              <DepartmentsField />
            </FieldWrapper>
            <FieldWrapper>
              <ThesisTypesField thesisTypesData={thesisTypesData} />
            </FieldWrapper>
            <FieldWrapper>
              <LanguagesField languagesData={languagesData} />
            </FieldWrapper>
            <FieldWrapper>
              <AuthorsField />
            </FieldWrapper>
            <FieldWrapper>
              <AdvisorsField />
            </FieldWrapper>
          </div>
        )}
      </div>
    </form>
  );
}

function FieldWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1 flex items-center">
      {children}
    </div>
  );
}
