"use client";

import BroomIcon from "@/components/icons/broom";
import BuildingIcon from "@/components/icons/building";
import LandmarkIcon from "@/components/icons/landmark";
import LanguageIcon from "@/components/icons/language";
import PenToolIcon from "@/components/icons/pen-tool";
import ThesisTypeIcon from "@/components/icons/sets/thesis-type";
import UserPenIcon from "@/components/icons/user-pen";
import { useIsTouchscreen } from "@/components/providers/is-touchscreen-provider";
import { searchLikePageParams } from "@/components/search/constants/client";
import { toggleInArray } from "@/components/search/helpers";
import MultiSelectCombobox from "@/components/search/multi-select-combobox";
import { useSearchResults } from "@/components/search/search-results-provider";
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
  SearchIcon,
  SettingsIcon,
  XIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
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

  const [asyncPush, isPendingAsyncPush] = useAsyncRouterPush();
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

  useEffect(() => {
    if (variant === "home") {
      setQueryQP(queryInputValue);
      return;
    }
    debouncedSetQueryQP(queryInputValue);
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

  const [advancedSearch, setAdvancedSearch] = useQueryState(
    "advanced",
    searchLikePageParams["advanced"]
  );

  const [queryAdvisors, setQueryAdvisors] = useState("");
  const {
    data: advisorOptions,
    isPending: isPendingAdvisors,
    isError: isErrorAdvisors,
  } = useQuery({
    queryKey: ["advisors", queryAdvisors ? queryAdvisors : undefined],
    queryFn: () =>
      searchAdvisors({
        q: queryAdvisors,
        page: 1,
        sort: undefined,
        client: meili,
      }),
  });

  const [queryAuthors, setQueryAuthors] = useState("");
  const {
    data: authorOptions,
    isPending: isPendingAuthors,
    isError: isErrorAuthors,
  } = useQuery({
    queryKey: ["authors", queryAuthors ? queryAuthors : undefined],
    queryFn: () =>
      searchAuthors({
        q: queryAuthors,
        page: 1,
        sort: undefined,
        client: meili,
      }),
  });

  const [queryDepartments, setQueryDepartments] = useState("");
  const {
    data: departmentOptions,
    isPending: isPendingDepartments,
    isError: isErrorDepartments,
  } = useQuery({
    queryKey: ["departments", queryDepartments ? queryDepartments : undefined],
    queryFn: () =>
      searchDepartments({
        q: queryDepartments,
        page: 1,
        sort: undefined,
        client: meili,
      }),
  });

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
  ]);

  useHotkeys("mod+k", () => {
    focusToMainInput();
  });

  const pushToSearch = async () => {
    console.log("Trying to push");
    const paramStr = searchParams.toString();
    await asyncPush(`/search${paramStr ? `?${paramStr}` : ""}`);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (variant === "home") {
      await pushToSearch();

      let pathname = window.location.pathname;
      let counter = 20;
      // TO-DO: Fix this, it is a horrible hack for Safari caused by search params not updating
      while (counter > 0 && pathname !== "search" && !isPendingAsyncPush) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        pathname = window.location.pathname;
        if (pathname === "/search") return;
        await pushToSearch();
        counter--;
      }
    }
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
  };

  const isTouchScreen = useIsTouchscreen();

  useEffect(() => {
    setTimeout(() => {
      if (isTouchScreen) return;
      focusToMainInput();
    });
  }, [isTouchScreen]);

  function focusToMainInput() {
    document.getElementById("main-search-input")?.focus();
    const input = document.getElementById(
      "main-search-input"
    ) as HTMLInputElement | null;
    input?.setSelectionRange(input.value.length, input.value.length);
  }

  const isPendingSearchResults = searchResultsContext
    ? searchResultsContext.isPending
    : false;

  return (
    <form
      data-pending={
        isPendingAsyncPush || isPendingSearchResults ? true : undefined
      }
      onSubmit={onSubmit}
      className={cn("w-full group/form flex flex-col items-center", className)}
    >
      {/* Main search box */}
      <div className="relative group/input w-144 max-w-full">
        <SearchIcon className="size-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-more-foreground" />
        <Input
          aria-label="Ara"
          id="main-search-input"
          type="search"
          enterKeyHint="search"
          disabled={isPendingAsyncPush}
          className="w-full pl-8.5 pr-12 bg-background-hover"
          placeholder="Tez, yazar, veya danışman ara..."
          value={queryInputValue}
          onChange={(e) => setQueryInputValue(e.target.value)}
        />
        {!isPendingAsyncPush &&
          !isPendingSearchResults &&
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
        {(isPendingAsyncPush || isPendingSearchResults) && (
          <div className="size-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-more-foreground">
            <LoaderIcon className="size-full animate-spin" />
          </div>
        )}
      </div>
      {/* Advanced search section */}
      <div
        data-advanced={advancedSearch ? true : undefined}
        className="w-full flex flex-col items-center group pt-3"
      >
        <div className="max-w-full flex flex-wrap justify-center items-center gap-2">
          <Button
            disabled={isPendingAsyncPush || isPendingSearchResults}
            className="py-[calc(0.5rem+1px)] px-5"
            fadeOnDisabled={false}
          >
            <div className="shrink min-w-0 flex items-center justify-center gap-2 group-data-[pending]/form:opacity-0">
              <div className="size-5 -ml-2.25">
                <SearchIcon className="size-full" />
              </div>
              <p className="shrink min-w-0">Ara</p>
            </div>
            {(isPendingAsyncPush || isPendingSearchResults) && (
              <div className="size-5 absolute left-1/2 top-1/2 transform -translate-y-1/2 -translate-x-1/2">
                <LoaderIcon className="size-full animate-spin" />
              </div>
            )}
          </Button>
          {/* Filter and clear buttons */}
          <div className="shrink min-w-0 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="font-semibold py-2 px-3.75"
              onClick={() => setAdvancedSearch((a) => !a)}
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
                <p className="shrink min-w-0">Temizle</p>
                <p className="shrink-0 -ml-0.25 bg-warning/16 text-warning text-xs px-1 py-px font-bold rounded-sm">
                  {totalSelectedFilters}
                </p>
              </Button>
            )}
          </div>
        </div>
        {/* Advanced settings */}
        {advancedSearch && (
          <div className="w-full max-w-3xl flex justify-center flex-wrap pt-2">
            <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1 flex items-center">
              {/* Year Gte */}
              <Select
                key={`year-gte-${yearGteQPKey}`}
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
                    <SelectItem value={clearButtonText}>
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
                    <SelectItem value={clearButtonText}>
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
            <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
              <MultiSelectCombobox
                label="Üniversite Bazlı Filterele"
                className="w-full"
                Icon={LandmarkIcon}
                commandButtonText={
                  <div className="flex-1 min-w-0 flex items-center">
                    <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                      Üniversite
                    </p>
                    {universitiesQP && universitiesQP.length > 0 && (
                      <p className="ml-1.5 shrink-0 bg-warning/16 text-warning text-xs px-1 py-px font-bold rounded-sm">
                        {universitiesQP.length}
                      </p>
                    )}
                  </div>
                }
                commandInputPlaceholder="Üniversite ara..."
                commandEmptyText="Eşleşen yok"
                isItemSelected={(v) => universitiesQP?.includes(v) || false}
                items={universityOptions}
                onSelectClear={
                  universitiesQP && universitiesQP.length > 0
                    ? clearUniversities
                    : undefined
                }
                onSelect={(v) => {
                  const newValue = toggleInArray(universitiesQP, v);
                  if (universitiesQP.join(",") !== newValue.join(",")) {
                    setUniversitiesQP(newValue);
                  }
                }}
                clearLength={universitiesQP?.length}
              />
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
              <MultiSelectCombobox
                commandFilter={() => 1}
                label="Ana Bilim Dalı Bazlı Filtrele"
                className="w-full"
                Icon={BuildingIcon}
                commandInputValue={queryDepartments}
                commandInputOnValueChange={(v) => setQueryDepartments(v)}
                isAsync
                isPending={isPendingDepartments}
                isError={isErrorDepartments}
                hasNext={
                  !isPendingDepartments &&
                  !isErrorDepartments &&
                  departmentOptions.totalPages > 1
                }
                toLoadMoreText={"Daha fazlası için arama yap"}
                items={
                  departmentOptions
                    ? departmentOptions?.hits.map((i) => ({
                        label: i.name,
                        value: i.name,
                      }))
                    : optionsPlaceholder
                }
                commandButtonText={
                  <div className="flex-1 min-w-0 flex items-center">
                    <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                      Ana Bilim Dalı
                    </p>
                    {departmentsQP && departmentsQP.length > 0 && (
                      <p className="ml-1.5 shrink-0 bg-warning/16 text-warning text-xs px-1 py-px font-bold rounded-sm">
                        {departmentsQP.length}
                      </p>
                    )}
                  </div>
                }
                commandInputPlaceholder="Ana bilim dalı ara..."
                commandEmptyText="Eşleşen yok"
                commandErrorText="Bir şeyler ters gitti"
                isItemSelected={(v) => departmentsQP?.includes(v) || false}
                onSelectClear={
                  departmentsQP && departmentsQP.length > 0
                    ? clearDepartments
                    : undefined
                }
                onSelect={(v) => {
                  const newValue = toggleInArray(departmentsQP, v);
                  if (departmentsQP.join(",") !== newValue.join(",")) {
                    setDepartmentsQP(newValue);
                  }
                }}
                clearLength={departmentsQP?.length}
              />
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
              <MultiSelectCombobox
                label="Tez Türü Bazlı Filtrele"
                className="w-full"
                Icon={ScrollTextIcon}
                IconSetForItem={ThesisTypeIcon}
                commandButtonText={
                  <div className="flex-1 min-w-0 flex items-center">
                    <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                      Tez Türü
                    </p>
                    {thesisTypesQP && thesisTypesQP.length > 0 && (
                      <p className="ml-1.5 shrink-0 bg-warning/16 text-warning text-xs px-1 py-px font-bold rounded-sm">
                        {thesisTypesQP.length}
                      </p>
                    )}
                  </div>
                }
                commandInputPlaceholder="Tez türü ara..."
                commandEmptyText="Eşleşen yok"
                isItemSelected={(v) => thesisTypesQP?.includes(v) || false}
                items={thesisTypeOptions}
                onSelect={(v) => {
                  const newValue = toggleInArray(thesisTypesQP, v);
                  if (thesisTypesQP.join(",") !== newValue.join(",")) {
                    setThesisTypesQP(newValue);
                  }
                }}
                onSelectClear={
                  thesisTypesQP && thesisTypesQP.length > 0
                    ? clearThesisTypes
                    : undefined
                }
                clearLength={thesisTypesQP?.length}
              />
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
              <MultiSelectCombobox
                label="Dil Bazlı Filtrele"
                className="w-full"
                Icon={GlobeIcon}
                IconSetForItem={LanguageIcon}
                iconSetForItemClassName="rounded-full"
                commandButtonText={
                  <div className="flex-1 min-w-0 flex items-center">
                    <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                      Dil
                    </p>
                    {languagesQP && languagesQP.length > 0 && (
                      <p className="ml-1.5 shrink-0 bg-warning/16 text-warning text-xs px-1 py-px font-bold rounded-sm">
                        {languagesQP.length}
                      </p>
                    )}
                  </div>
                }
                commandInputPlaceholder="Dil ara..."
                commandEmptyText="Eşleşen yok"
                isItemSelected={(v) => languagesQP?.includes(v) || false}
                items={languageOptions}
                onSelect={(v) => {
                  const newValue = toggleInArray(languagesQP, v);
                  if (languagesQP.join(",") !== newValue.join(",")) {
                    setLanguagesQP(newValue);
                  }
                }}
                onSelectClear={
                  languagesQP && languagesQP.length > 0
                    ? clearLanguages
                    : undefined
                }
                clearLength={languagesQP?.length}
              />
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
              <MultiSelectCombobox
                commandFilter={() => 1}
                label="Yazar Bazlı Filtrele"
                className="w-full"
                Icon={PenToolIcon}
                commandInputValue={queryAuthors}
                commandInputOnValueChange={(v) => setQueryAuthors(v)}
                isAsync
                isPending={isPendingAuthors}
                isError={isErrorAuthors}
                hasNext={
                  !isPendingAuthors &&
                  !isErrorAuthors &&
                  authorOptions.totalPages > 1
                }
                toLoadMoreText={"Daha fazlası için arama yap"}
                items={
                  authorOptions
                    ? authorOptions?.hits.map((i) => ({
                        label: i.name,
                        value: i.name,
                      }))
                    : optionsPlaceholder
                }
                commandButtonText={
                  <div className="flex-1 min-w-0 flex items-center">
                    <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                      Yazar
                    </p>
                    {authorsQP && authorsQP.length > 0 && (
                      <p className="ml-1.5 shrink-0 bg-warning/16 text-warning text-xs px-1 py-px font-bold rounded-sm">
                        {authorsQP.length}
                      </p>
                    )}
                  </div>
                }
                commandInputPlaceholder="Yazar ara..."
                commandEmptyText="Eşleşen yok"
                commandErrorText="Bir şeyler ters gitti"
                isItemSelected={(v) => authorsQP?.includes(v) || false}
                onSelectClear={
                  authorsQP && authorsQP.length > 0 ? clearAuthors : undefined
                }
                onSelect={(v) => {
                  const newValue = toggleInArray(authorsQP, v);
                  if (authorsQP.join(",") !== newValue.join(",")) {
                    setAuthorsQP(newValue);
                  }
                }}
                clearLength={authorsQP?.length}
              />
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
              <MultiSelectCombobox
                commandFilter={() => 1}
                label="Danışman Bazlı Filtrele"
                className="w-full"
                Icon={UserPenIcon}
                commandInputValue={queryAdvisors}
                commandInputOnValueChange={(v) => setQueryAdvisors(v)}
                isAsync
                isPending={isPendingAdvisors}
                isError={isErrorAdvisors}
                hasNext={
                  !isPendingAdvisors &&
                  !isErrorAdvisors &&
                  advisorOptions.totalPages > 1
                }
                toLoadMoreText={"Daha fazlası için arama yap"}
                items={
                  advisorOptions
                    ? advisorOptions?.hits.map((i) => ({
                        label: i.name,
                        value: i.name,
                      }))
                    : optionsPlaceholder
                }
                commandButtonText={
                  <div className="flex-1 min-w-0 flex items-center">
                    <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                      Danışman
                    </p>
                    {advisorsQP && advisorsQP.length > 0 && (
                      <p className="ml-1.5 shrink-0 bg-warning/16 text-warning text-xs px-1 py-px font-bold rounded-sm">
                        {advisorsQP.length}
                      </p>
                    )}
                  </div>
                }
                commandInputPlaceholder="Danışman ara..."
                commandEmptyText="Eşleşen yok"
                commandErrorText="Bir şeyler ters gitti"
                isItemSelected={(v) => advisorsQP?.includes(v) || false}
                onSelectClear={
                  advisorsQP && advisorsQP.length > 0
                    ? clearAdvisors
                    : undefined
                }
                onSelect={(v) => {
                  const newValue = toggleInArray(advisorsQP, v);
                  if (advisorsQP.join(",") !== newValue.join(",")) {
                    setAdvisorsQP(newValue);
                  }
                }}
                clearLength={advisorsQP?.length}
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
