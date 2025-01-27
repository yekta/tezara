"use client";

import BroomIcon from "@/components/icons/broom";
import BuildingIcon from "@/components/icons/building";
import LandmarkIcon from "@/components/icons/landmark";
import LanguageIcon from "@/components/icons/language";
import PenToolIcon from "@/components/icons/pen-tool";
import ThesisTypeIcon from "@/components/icons/sets/thesis-type";
import UserPenIcon from "@/components/icons/user-pen";
import { useIsTouchscreen } from "@/components/providers/is-touchscreen-provider";
import {
  searchLikePageParams,
  TAttributesToSearchOn,
} from "@/components/search/constants";
import FilterCountChip from "@/components/search/filter-count-chip";
import { toggleInArray } from "@/components/search/helpers";
import MultiSelectCombobox from "@/components/search/multi-select-combobox";
import { useSearchResults } from "@/components/search/results/search-results-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/components/ui/utils";
import { useAsyncRouterPush } from "@/lib/hooks/use-async-router-push";
import useDebounceIf from "@/lib/hooks/use-debounce-if";
import { useUmami } from "@/lib/hooks/use-umami";
import { meili } from "@/server/meili/constants-client";
import { searchAdvisors } from "@/server/meili/repo/advisors";
import { searchAuthors } from "@/server/meili/repo/authors";
import { searchDepartments } from "@/server/meili/repo/departments";
import { TGetLanguagesResult } from "@/server/meili/repo/language";
import { TGetThesisTypesResult } from "@/server/meili/repo/thesis-type";
import { TGetUniversitiesResult } from "@/server/meili/repo/university";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarArrowDownIcon,
  ChevronUpIcon,
  GlobeIcon,
  LoaderIcon,
  ScrollTextIcon,
  SearchCheckIcon,
  SearchIcon,
  SettingsIcon,
  XIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useDebounceCallback } from "usehooks-ts";

type Props = {
  className?: string;
  variant: "home" | "search";
  languages: TGetLanguagesResult["hits"];
  universities: TGetUniversitiesResult["hits"];
  thesisTypes: TGetThesisTypesResult["hits"];
};

const clearButtonText = "Temizle";

const optionsPlaceholder = Array.from({ length: 20 }).map((_, i) => ({
  label: `Yükleniyor ${i + 1}`,
  value: `Yükleniyor ${i + 1}`,
}));

export default function SearchBox({
  languages,
  universities,
  thesisTypes,
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

  const minYear = 1950;
  const maxYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const options = [];
    for (let i = maxYear; i >= minYear; i--) {
      options.push({
        value: i.toString(),
        label: i.toString(),
      });
    }
    return options;
  }, [minYear, maxYear]);

  const [queryQP, setQueryQP] = useQueryState("q", searchLikePageParams["q"]);
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

  const [languagesQP, setLanguagesQP] = useQueryState(
    "languages",
    searchLikePageParams["languages"]
  );
  const [universitiesQP, setUniversitiesQP] = useQueryState(
    "universities",
    searchLikePageParams["universities"]
  );
  const [departmentsQP, setDepartmentsQP] = useQueryState(
    "departments",
    searchLikePageParams["departments"]
  );
  const [advisorsQP, setAdvisorsQP] = useQueryState(
    "advisors",
    searchLikePageParams["advisors"]
  );
  const [authorsQP, setAuthorsQP] = useQueryState(
    "authors",
    searchLikePageParams["authors"]
  );
  const [searchOnQP, setAttributesToSearchOnQP] = useQueryState(
    "search_on",
    searchLikePageParams["search_on"]
  );
  const [thesisTypesQP, setThesisTypesQP] = useQueryState(
    "thesis_types",
    searchLikePageParams["thesis_types"]
  );

  const [yearLteQP, setYearLteQP] = useQueryState(
    "year_lte",
    searchLikePageParams["year_lte"]
  );
  const [yearLteQPKey, setYearLteQPKey] = useState(0);

  const [yearGteQP, setYearGteQP] = useQueryState(
    "year_gte",
    searchLikePageParams["year_gte"]
  );
  const [yearGteQPKey, setYearGteQPKey] = useState(0);

  const [advancedSearchQP, setAdvancedSearchQP] = useQueryState(
    "advanced",
    searchLikePageParams["advanced"]
  );

  const isNonEmpty = useCallback(
    (v: string) => v !== "" && v !== null && v !== undefined,
    []
  );
  const [queryAdvisors, setQueryAdvisors, debouncedQueryAdvisors] =
    useDebounceIf("", isNonEmpty, 150);
  const [queryAuthors, setQueryAuthors, debouncedQueryAuthors] = useDebounceIf(
    "",
    isNonEmpty,
    150
  );
  const [queryDepartments, setQueryDepartments, debouncedQueryDepartments] =
    useDebounceIf("", isNonEmpty, 150);

  const {
    data: advisorsData,
    isPending: isPendingAdvisors,
    isFetching: isFetchingAdvisors,
    isError: isErrorAdvisors,
  } = useQuery({
    queryKey: [
      "advisors",
      debouncedQueryAdvisors ? debouncedQueryAdvisors : undefined,
    ],
    queryFn: () =>
      searchAdvisors({
        q: debouncedQueryAdvisors,
        page: 1,
        sort: undefined,
        client: meili,
      }),
    placeholderData: (prev) => prev,
  });

  const {
    data: authorsData,
    isPending: isPendingAuthors,
    isFetching: isFetchingAuthors,
    isError: isErrorAuthors,
  } = useQuery({
    queryKey: [
      "authors",
      debouncedQueryAuthors ? debouncedQueryAuthors : undefined,
    ],
    queryFn: () =>
      searchAuthors({
        q: debouncedQueryAuthors,
        page: 1,
        sort: undefined,
        client: meili,
      }),
    placeholderData: (prev) => prev,
  });

  const {
    data: departmentsData,
    isPending: isPendingDepartments,
    isFetching: isFetchingDepartments,
    isError: isErrorDepartments,
  } = useQuery({
    queryKey: [
      "departments",
      debouncedQueryDepartments ? debouncedQueryDepartments : undefined,
    ],
    queryFn: () =>
      searchDepartments({
        q: debouncedQueryDepartments,
        page: 1,
        sort: undefined,
        client: meili,
      }),
    placeholderData: (prev) => prev,
  });
  const languageOptions = useMemo(
    () =>
      languages.map((l) => ({
        value: l.name,
        label: l.name,
      })),
    [languages]
  );
  const universityOptions = useMemo(
    () =>
      universities.map((u) => ({
        value: u.name,
        label: u.name,
      })),
    [universities]
  );
  const thesisTypeOptions = useMemo(
    () =>
      thesisTypes.map((t) => ({
        value: t.name,
        label: t.name,
      })),
    [thesisTypes]
  );
  const advisorOptions = useMemo(
    () =>
      advisorsData?.hits.map((a) => ({
        value: a.name,
        label: a.name,
      })) || null,
    [advisorsData]
  );
  const authorOptions = useMemo(
    () =>
      authorsData?.hits.map((a) => ({
        value: a.name,
        label: a.name,
      })) || null,
    [authorsData]
  );
  const departmentOptions = useMemo(
    () =>
      departmentsData?.hits.map((d) => ({
        value: d.name,
        label: d.name,
      })) || null,
    [departmentsData]
  );

  const totalSelectedFilters = useMemo(() => {
    let total = 0;
    if (languagesQP) total += languagesQP.length;
    if (universitiesQP) total += universitiesQP.length;
    if (departmentsQP) total += departmentsQP.length;
    if (advisorsQP) total += advisorsQP.length;
    if (authorsQP) total += authorsQP.length;
    if (thesisTypesQP) total += thesisTypesQP.length;
    if (yearLteQP !== null && yearLteQP !== undefined) total += 1;
    if (yearGteQP !== null && yearGteQP !== undefined) total += 1;
    if (searchOnQP) total += searchOnQP.length;
    return total;
  }, [
    languagesQP,
    universitiesQP,
    departmentsQP,
    advisorsQP,
    authorsQP,
    thesisTypesQP,
    yearGteQP,
    yearLteQP,
    searchOnQP,
  ]);

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

  const clearUniversities = () => setUniversitiesQP([]);
  const clearDepartments = () => setDepartmentsQP([]);
  const clearAdvisors = () => setAdvisorsQP([]);
  const clearAuthors = () => setAuthorsQP([]);
  const clearLanguages = () => setLanguagesQP([]);
  const clearThesisTypes = () => setThesisTypesQP([]);
  const clearSearchOn = () => setAttributesToSearchOnQP([]);

  const clearYearGte = () => {
    setYearGteQP(null);
    setYearGteQPKey((k) => k + 1);
  };
  const clearYearLte = () => {
    setYearLteQP(null);
    setYearLteQPKey((k) => k + 1);
  };

  const clearAllFilters = () => {
    clearUniversities();
    clearDepartments();
    clearAdvisors();
    clearAuthors();
    clearLanguages();
    clearThesisTypes();
    clearYearGte();
    clearYearLte();
    clearSearchOn();
  };

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
      data-pending={
        isPendingPush || isPendingOrFetchingResults ? true : undefined
      }
      onSubmit={onSubmit}
      className={cn("w-full group/form flex flex-col items-center", className)}
    >
      {/* Main search box */}
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
      {/* Advanced search section */}
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
            {totalSelectedFilters > 0 && (
              <Button
                type="button"
                variant="warning-outline"
                className="font-semibold py-2 px-3.75"
                onClick={() => clearAllFilters()}
              >
                <div className="size-5 -ml-1 transform transition">
                  <BroomIcon className="size-full" />
                </div>
                <p className="shrink min-w-0">{clearButtonText}</p>
                <FilterCountChip className="-ml-0.25">
                  {totalSelectedFilters.toLocaleString()}
                </FilterCountChip>
              </Button>
            )}
          </div>
        </div>
        {/* Advanced settings */}
        {advancedSearchQP && (
          <div className="w-full max-w-3xl flex justify-center flex-wrap pt-2">
            {/* Search On */}
            <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
              <MultiSelectCombobox
                label="Arama Alanlarını Seç"
                className="w-full"
                triggerOnClick={() => {
                  umami.capture("Search On Filter Clicked");
                  posthog.capture("Search On Filter Clicked");
                }}
                Icon={SearchCheckIcon}
                commandButtonText={
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                      Arama Alanları
                    </p>
                    {searchOnQP && searchOnQP.length > 0 && (
                      <FilterCountChip>
                        {searchOnQP.length.toLocaleString()}
                      </FilterCountChip>
                    )}
                  </div>
                }
                commandInputPlaceholder="Alan bul..."
                commandEmptyText="Eşleşen yok"
                isItemSelected={(value) => {
                  if (!searchOnQP) return false;
                  return searchOnQP.includes(value as TAttributesToSearchOn);
                }}
                items={searchOnOptions}
                onClearButtonClick={clearSearchOn}
                clearLength={searchOnQP?.length}
                onSelect={(label) => {
                  const matchingOption = searchOnOptions.find(
                    (o) => o.label === label
                  );
                  if (!matchingOption) return;
                  const newValue = toggleInArray(
                    searchOnQP,
                    matchingOption.value
                  );
                  if (searchOnQP.join(",") !== newValue.join(",")) {
                    setAttributesToSearchOnQP(newValue);
                  }
                }}
              />
            </div>
            {/* Year Filters */}
            <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1 flex items-center">
              {/* Year Gte */}
              <Select
                key={`year-gte-${yearGteQPKey}`}
                onOpenChange={(o) => {
                  if (o) {
                    umami.capture("Year GTE Filter Clicked");
                    posthog.capture("Year GTE Filter Clicked");
                  }
                }}
                value={yearGteQP?.toString()}
                onValueChange={(v) => {
                  if (v === clearButtonText) {
                    clearYearGte();
                    return;
                  }
                  const year = parseInt(v);
                  if (
                    v === undefined ||
                    v === null ||
                    v === "" ||
                    isNaN(year)
                  ) {
                    setYearGteQP(null);
                  } else if (year !== yearGteQP) {
                    setYearGteQP(year);
                  }
                }}
              >
                <SelectTrigger
                  aria-label="Başlangıç Yılı"
                  className="flex-1 py-2 rounded-r-none -mr-[0.5px]"
                  classNameInnerContainer="flex items-center -ml-0.5"
                >
                  <CalendarArrowDownIcon className="size-4 shrink-0" />
                  <SelectValue placeholder="Yıl >=">
                    <div className="flex shrink min-w-0 items-center gap-0.5 overflow-hidden">
                      <p className="shrink min-w-0 overflow-hidden overflow-ellipsis">
                        {yearGteQP ? yearGteQP : `Yıl >=`}
                      </p>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="p-1 w-[--radix-popper-anchor-width]">
                  {yearGteQP && (
                    <SelectItem
                      value={clearButtonText}
                      className="data-[highlighted]:bg-warning/20"
                    >
                      <div className="shrink min-w-0 flex items-center gap-1 text-warning">
                        <BroomIcon className="size-4 -my-1" />
                        <p className="shrink font-semibold min-w-0 overflow-hidden overflow-ellipsis">
                          {clearButtonText}
                        </p>
                      </div>
                    </SelectItem>
                  )}
                  {yearOptions.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Year LTE */}
              <Select
                key={`year-lte-${yearLteQPKey}`}
                onOpenChange={(o) => {
                  if (o) {
                    umami.capture("Year LTE Filter Clicked");
                    posthog.capture("Year LTE Filter Clicked");
                  }
                }}
                value={yearLteQP?.toString()}
                onValueChange={(v) => {
                  if (v === clearButtonText) {
                    clearYearLte();
                    return;
                  }
                  const year = parseInt(v);
                  if (
                    v === undefined ||
                    v === null ||
                    v === "" ||
                    isNaN(year)
                  ) {
                    setYearLteQP(null);
                  } else if (year !== yearLteQP) {
                    setYearLteQP(year);
                  }
                }}
              >
                <SelectTrigger
                  aria-label="Bitiş Yılı"
                  className="flex-1 py-2 rounded-l-none -ml-[0.5px]"
                  classNameInnerContainer="flex items-center -ml-0.5"
                >
                  <CalendarArrowDownIcon className="size-4 shrink-0" />
                  <SelectValue placeholder="Yıl <=">
                    <div className="flex shrink min-w-0 items-center gap-0.5 overflow-hidden">
                      <p className="shrink min-w-0 overflow-hidden overflow-ellipsis">
                        {yearLteQP ? yearLteQP : `Yıl <=`}
                      </p>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="p-1 w-[--radix-popper-anchor-width]">
                  {yearLteQP && (
                    <SelectItem
                      className="data-[highlighted]:bg-warning/20"
                      value={clearButtonText}
                    >
                      <div className="shrink min-w-0 flex items-center gap-1 text-warning">
                        <BroomIcon className="size-4 -my-1" />
                        <p className="shrink font-semibold min-w-0 overflow-hidden overflow-ellipsis">
                          {clearButtonText}
                        </p>
                      </div>
                    </SelectItem>
                  )}
                  {yearOptions.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* University */}
            <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
              <MultiSelectCombobox
                label="Üniversite Bazlı Filterele"
                className="w-full"
                triggerOnClick={() => {
                  umami.capture("University Filter Clicked");
                  posthog.capture("University Filter Clicked");
                }}
                Icon={LandmarkIcon}
                commandButtonText={
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                      Üniversite
                    </p>
                    {universitiesQP && universitiesQP.length > 0 && (
                      <FilterCountChip>
                        {universitiesQP.length.toLocaleString()}
                      </FilterCountChip>
                    )}
                  </div>
                }
                commandInputPlaceholder="Üniversite ara..."
                commandEmptyText="Eşleşen yok"
                isItemSelected={(v) => universitiesQP?.includes(v) || false}
                items={universityOptions}
                onClearButtonClick={clearUniversities}
                clearLength={universitiesQP?.length}
                onSelect={(v) => {
                  const newValue = toggleInArray(universitiesQP, v);
                  if (universitiesQP.join(",") !== newValue.join(",")) {
                    setUniversitiesQP(newValue);
                  }
                }}
              />
            </div>
            {/* Institute */}
            <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
              <MultiSelectCombobox
                commandFilter={() => 1}
                label="Ana Bilim Dalı Bazlı Filtrele"
                className="w-full"
                triggerOnClick={() => {
                  umami.capture("Department Filter Clicked");
                  posthog.capture("Department Filter Clicked");
                }}
                Icon={BuildingIcon}
                commandInputValue={queryDepartments}
                commandInputOnValueChange={(v) => setQueryDepartments(v)}
                isAsync
                isPending={isPendingDepartments}
                isFetching={isFetchingDepartments}
                isError={isErrorDepartments}
                hasNext={
                  !isPendingDepartments &&
                  !isErrorDepartments &&
                  departmentOptions !== null &&
                  departmentsData.totalPages > 1
                }
                toLoadMoreText={"Diğerleri için arama yap"}
                items={
                  departmentOptions ? departmentOptions : optionsPlaceholder
                }
                commandButtonText={
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                      Ana Bilim Dalı
                    </p>
                    {departmentsQP && departmentsQP.length > 0 && (
                      <FilterCountChip>
                        {departmentsQP.length.toLocaleString()}
                      </FilterCountChip>
                    )}
                  </div>
                }
                commandInputPlaceholder="Ana bilim dalı ara..."
                commandEmptyText="Eşleşen yok"
                commandErrorText="Bir şeyler ters gitti"
                isItemSelected={(v) => departmentsQP?.includes(v) || false}
                onClearButtonClick={clearDepartments}
                clearLength={departmentsQP?.length}
                onSelect={(v) => {
                  const newValue = toggleInArray(departmentsQP, v);
                  if (departmentsQP.join(",") !== newValue.join(",")) {
                    setDepartmentsQP(newValue);
                  }
                }}
              />
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
              <MultiSelectCombobox
                label="Tez Türü Bazlı Filtrele"
                className="w-full"
                triggerOnClick={() => {
                  umami.capture("Thesis Type Filter Clicked");
                  posthog.capture("Thesis Type Filter Clicked");
                }}
                Icon={ScrollTextIcon}
                IconSetForItem={ThesisTypeIcon}
                commandButtonText={
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                      Tez Türü
                    </p>
                    {thesisTypesQP && thesisTypesQP.length > 0 && (
                      <FilterCountChip>
                        {thesisTypesQP.length.toLocaleString()}
                      </FilterCountChip>
                    )}
                  </div>
                }
                commandInputPlaceholder="Tez türü ara..."
                commandEmptyText="Eşleşen yok"
                isItemSelected={(v) => thesisTypesQP?.includes(v) || false}
                items={thesisTypeOptions}
                onClearButtonClick={clearThesisTypes}
                clearLength={thesisTypesQP?.length}
                onSelect={(v) => {
                  const newValue = toggleInArray(thesisTypesQP, v);
                  if (thesisTypesQP.join(",") !== newValue.join(",")) {
                    setThesisTypesQP(newValue);
                  }
                }}
              />
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
              <MultiSelectCombobox
                label="Dil Bazlı Filtrele"
                className="w-full"
                triggerOnClick={() => {
                  umami.capture("Language Filter Clicked");
                  posthog.capture("Language Filter Clicked");
                }}
                Icon={GlobeIcon}
                IconSetForItem={LanguageIcon}
                iconSetForItemClassName="rounded-full"
                commandButtonText={
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                      Dil
                    </p>
                    {languagesQP && languagesQP.length > 0 && (
                      <FilterCountChip>
                        {languagesQP.length.toLocaleString()}
                      </FilterCountChip>
                    )}
                  </div>
                }
                commandInputPlaceholder="Dil ara..."
                commandEmptyText="Eşleşen yok"
                isItemSelected={(v) => languagesQP?.includes(v) || false}
                items={languageOptions}
                onClearButtonClick={clearLanguages}
                clearLength={languagesQP?.length}
                onSelect={(v) => {
                  const newValue = toggleInArray(languagesQP, v);
                  if (languagesQP.join(",") !== newValue.join(",")) {
                    setLanguagesQP(newValue);
                  }
                }}
              />
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
              <MultiSelectCombobox
                commandFilter={() => 1}
                label="Yazar Bazlı Filtrele"
                className="w-full"
                triggerOnClick={() => {
                  umami.capture("Author Filter Clicked");
                  posthog.capture("Author Filter Clicked");
                }}
                Icon={PenToolIcon}
                commandInputValue={queryAuthors}
                commandInputOnValueChange={(v) => setQueryAuthors(v)}
                isAsync
                isPending={isPendingAuthors}
                isFetching={isFetchingAuthors}
                isError={isErrorAuthors}
                hasNext={
                  !isPendingAuthors &&
                  !isErrorAuthors &&
                  authorOptions !== null &&
                  authorsData.totalPages > 1
                }
                toLoadMoreText={"Diğerleri için arama yap"}
                items={authorOptions ? authorOptions : optionsPlaceholder}
                commandButtonText={
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                      Yazar
                    </p>
                    {authorsQP && authorsQP.length > 0 && (
                      <FilterCountChip>
                        {authorsQP.length.toLocaleString()}
                      </FilterCountChip>
                    )}
                  </div>
                }
                commandInputPlaceholder="Yazar ara..."
                commandEmptyText="Eşleşen yok"
                commandErrorText="Bir şeyler ters gitti"
                isItemSelected={(v) => authorsQP?.includes(v) || false}
                onClearButtonClick={clearAuthors}
                clearLength={authorsQP?.length}
                onSelect={(v) => {
                  const newValue = toggleInArray(authorsQP, v);
                  if (authorsQP.join(",") !== newValue.join(",")) {
                    setAuthorsQP(newValue);
                  }
                }}
              />
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
              <MultiSelectCombobox
                commandFilter={() => 1}
                label="Danışman Bazlı Filtrele"
                className="w-full"
                triggerOnClick={() => {
                  umami.capture("Advisor Filter Clicked");
                  posthog.capture("Advisor Filter Clicked");
                }}
                Icon={UserPenIcon}
                commandInputValue={queryAdvisors}
                commandInputOnValueChange={(v) => setQueryAdvisors(v)}
                isAsync
                isPending={isPendingAdvisors}
                isFetching={isFetchingAdvisors}
                isError={isErrorAdvisors}
                hasNext={
                  !isPendingAdvisors &&
                  !isErrorAdvisors &&
                  advisorOptions !== null &&
                  advisorsData.totalPages > 1
                }
                toLoadMoreText={"Diğerleri için arama yap"}
                items={advisorOptions ? advisorOptions : optionsPlaceholder}
                commandButtonText={
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                      Danışman
                    </p>
                    {advisorsQP && advisorsQP.length > 0 && (
                      <FilterCountChip>
                        {advisorsQP.length.toLocaleString()}
                      </FilterCountChip>
                    )}
                  </div>
                }
                commandInputPlaceholder="Danışman ara..."
                commandEmptyText="Eşleşen yok"
                commandErrorText="Bir şeyler ters gitti"
                isItemSelected={(v) => advisorsQP?.includes(v) || false}
                onClearButtonClick={clearAdvisors}
                clearLength={advisorsQP?.length}
                onSelect={(v) => {
                  const newValue = toggleInArray(advisorsQP, v);
                  if (advisorsQP.join(",") !== newValue.join(",")) {
                    setAdvisorsQP(newValue);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

const searchOnOptions: { value: TAttributesToSearchOn; label: string }[] = [
  {
    value: "title",
    label: "Başlık",
  },
  {
    value: "abstract",
    label: "Özet",
  },
  {
    value: "subjects",
    label: "Konular",
  },
  {
    value: "keywords",
    label: "Anahtar Kelimeler",
  },
  {
    value: "author",
    label: "Yazar",
  },
  {
    value: "advisors",
    label: "Danışmanlar",
  },
];
