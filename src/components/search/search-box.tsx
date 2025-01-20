"use client";

import BroomIcon from "@/components/icons/broom";
import LanguageIcon from "@/components/icons/language";
import ThesisTypeIcon from "@/components/icons/thesis-type";
import { useIsTouchscreen } from "@/components/providers/is-touchscreen-provider";
import { searchLikePageParams } from "@/components/search/constants/client";
import { toggleInArray } from "@/components/search/helpers";
import MultiSelectFormItem from "@/components/search/multi-select-form-item";
import { useSearchResults } from "@/components/search/search-results-provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/components/ui/utils";
import { useAsyncRouterPush } from "@/lib/hooks/use-async-router-push";
import { TGetLanguagesResult } from "@/server/meili/repo/language";
import { TGetThesisTypesResult } from "@/server/meili/repo/thesis-type";
import { TGetUniversitiesResult } from "@/server/meili/repo/university";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounce } from "@uidotdev/usehooks";
import {
  CalendarArrowDownIcon,
  ChevronUpIcon,
  GlobeIcon,
  LandmarkIcon,
  LoaderIcon,
  ScrollTextIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import { z } from "zod";

const SearchThesesSchema = z.object({
  query: z.string(),
  languages: z.array(z.string()),
  universities: z.array(z.string()),
  advisors: z.array(z.string()),
  thesisTypes: z.array(z.string()),
  yearGte: z.number().or(z.null()),
  yearLte: z.number().or(z.null()),
});

type Props = {
  className?: string;
  variant: "home" | "search";
  languages: TGetLanguagesResult["hits"];
  universities: TGetUniversitiesResult["hits"];
  thesisTypes: TGetThesisTypesResult["hits"];
};

const clearButtonText = "Temizle";

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

  const [query, setQuery] = useQueryState("q", searchLikePageParams["q"]);
  const [languagesQP, setLanguagesQP] = useQueryState(
    "languages",
    searchLikePageParams["languages"]
  );
  const [universitiesQP, setUniversitiesQP] = useQueryState(
    "universities",
    searchLikePageParams["universities"]
  );
  const [advisorsQP, setAdvisorsQP] = useQueryState(
    "advisors",
    searchLikePageParams["advisors"]
  );
  const [thesisTypesQP, setThesisTypesQP] = useQueryState(
    "thesis_types",
    searchLikePageParams["thesis_types"]
  );
  const [yearLteQP, setYearLteQP] = useQueryState(
    "year_lte",
    searchLikePageParams["year_lte"]
  );
  const [yearGteQP, setYearGteQP] = useQueryState(
    "year_gte",
    searchLikePageParams["year_gte"]
  );
  const [advancedSearch, setAdvancedSearch] = useQueryState(
    "advanced",
    searchLikePageParams["advanced"]
  );

  const [asyncPush, isPendingAsyncPush] = useAsyncRouterPush();

  const form = useForm<z.infer<typeof SearchThesesSchema>>({
    resolver: zodResolver(SearchThesesSchema),
    defaultValues: {
      query,
      languages: languagesQP,
      universities: universitiesQP,
      advisors: advisorsQP,
      thesisTypes: thesisTypesQP,
      yearLte: yearLteQP,
      yearGte: yearGteQP,
    },
  });

  const queryInput = form.watch("query");
  const selectedLanguages = form.watch("languages");
  const selectedUniversities = form.watch("universities");
  const selectedThesisTypes = form.watch("thesisTypes");
  const selectedYearLte = form.watch("yearLte");
  const selectedYearGte = form.watch("yearGte");
  const selectedAdvisors = form.watch("advisors");

  const totalSelectedFilters = useMemo(() => {
    let total = 0;
    if (selectedLanguages) total += selectedLanguages.length;
    if (selectedUniversities) total += selectedUniversities.length;
    if (selectedAdvisors) total += selectedAdvisors.length;
    if (selectedThesisTypes) total += selectedThesisTypes.length;
    if (selectedYearLte !== null && selectedYearLte !== undefined) total += 1;
    if (selectedYearGte !== null && selectedYearGte !== undefined) total += 1;
    return total;
  }, [
    selectedLanguages,
    selectedUniversities,
    selectedAdvisors,
    selectedThesisTypes,
    selectedYearGte,
    selectedYearLte,
  ]);

  const debouncedQueryInput = useDebounce(queryInput, 150);

  useHotkeys("mod+k", () => {
    focusToMainInput();
  });

  useEffect(() => {
    if (queryInput === query) return;
    if (variant !== "home") return;
    setQuery(queryInput);
  }, [queryInput, variant, setQuery, query]);

  useEffect(() => {
    if (debouncedQueryInput === query) return;
    if (variant !== "search") return;
    setQuery(debouncedQueryInput);
  }, [debouncedQueryInput, variant, setQuery, query]);

  async function onSubmit(data: z.infer<typeof SearchThesesSchema>) {
    if (variant === "home") {
      const paramStr = searchParams.toString();
      await asyncPush(`/search${paramStr ? `?${paramStr}` : ""}`);
      return;
    }
    if (variant === "search") {
      setQuery(data.query);
      setLanguagesQP(data.languages);
      setUniversitiesQP(data.universities);
      setAdvisorsQP(data.advisors);
      setThesisTypesQP(data.thesisTypes);
      setYearGteQP(data.yearGte && data.yearGte > 0 ? data.yearGte : null);
      setYearLteQP(data.yearLte && data.yearLte > 0 ? data.yearLte : null);
      return;
    }
  }

  function clearQueryInput() {
    form.setValue("query", "");
    form.setFocus("query");
  }

  function clearUniversities() {
    form.setValue("universities", []);
    setUniversitiesQP([]);
  }

  function clearAdvisors() {
    form.setValue("advisors", []);
    setAdvisorsQP([]);
  }

  function clearLanguages() {
    form.setValue("languages", []);
    setLanguagesQP([]);
  }

  function clearThesisTypes() {
    form.setValue("thesisTypes", []);
    setThesisTypesQP([]);
  }

  function clearYearGte() {
    form.setValue("yearGte", null);
    setYearGteQP(null);
  }

  function clearYearLte() {
    form.setValue("yearLte", null);
    setYearLteQP(null);
  }

  function clearAllFilters() {
    clearUniversities();
    clearAdvisors();
    clearLanguages();
    clearThesisTypes();
    clearYearGte();
    clearYearLte();
  }

  const isTouchScreen = useIsTouchscreen();
  const formRef = useRef(form);

  useEffect(() => {
    setTimeout(() => {
      if (isTouchScreen) return;
      focusToMainInput();
    });
  }, [isTouchScreen, formRef]);

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
    <Form {...form}>
      <form
        data-pending={
          isPendingAsyncPush || isPendingSearchResults ? true : undefined
        }
        onSubmit={form.handleSubmit(onSubmit, console.error)}
        className={cn(
          "w-full group/form flex flex-col items-center",
          className
        )}
      >
        {/* Main search box */}
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem className="w-144 max-w-full">
              <FormLabel className="sr-only">Ara</FormLabel>
              <div className="w-full relative group/input">
                <SearchIcon className="size-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-more-foreground" />
                <Input
                  id="main-search-input"
                  type="search"
                  enterKeyHint="search"
                  disabled={isPendingAsyncPush}
                  className="w-full pl-8.5 pr-12 bg-background-hover"
                  placeholder="Tez, yazar, veya danışman ara..."
                  {...field}
                />
                {!isPendingAsyncPush &&
                  !isPendingSearchResults &&
                  queryInput !== undefined &&
                  queryInput !== "" &&
                  queryInput !== null && (
                    <Button
                      size="icon"
                      aria-label="Aramayı temizle"
                      variant="ghost"
                      className="absolute size-9 text-muted-foreground right-1 top-1/2 transform -translate-y-1/2"
                      type="button"
                      onClick={clearQueryInput}
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
            </FormItem>
          )}
        />
        {/* Advanced search section */}
        <div
          data-advanced={advancedSearch ? true : undefined}
          className="w-full flex flex-col items-center group pt-3"
        >
          <div className="max-w-full flex flex-wrap justify-center gap-2">
            <Button
              disabled={isPendingAsyncPush || isPendingSearchResults}
              className="py-2 px-6"
              fadeOnDisabled={false}
            >
              <p className="min-w-0 shrink group-data-[pending]/form:opacity-0">
                Ara
              </p>
              {(isPendingAsyncPush || isPendingSearchResults) && (
                <div className="size-5 absolute left-1/2 top-1/2 transform -translate-y-1/2 -translate-x-1/2">
                  <LoaderIcon className="size-full animate-spin" />
                </div>
              )}
            </Button>
            <div className="shrink min-w-0 flex flex-wrap">
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground font-semibold py-2 px-3.5"
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
                  variant="warning-ghost"
                  className="font-semibold py-2 px-3.5"
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
                <FormField
                  control={form.control}
                  name="yearGte"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="sr-only">Yıl Büyüktür</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          if (v === clearButtonText) {
                            clearYearGte();
                            return;
                          }
                          const year = parseInt(v);
                          if (year !== yearGteQP) {
                            setYearGteQP(year);
                          }
                          field.onChange(year);
                          console.log("triggered", year);
                          console.log(form.getValues("yearGte"));
                        }}
                      >
                        <FormControl>
                          <SelectTrigger
                            className="py-2 rounded-r-none -mr-[0.5px]"
                            classNameInnerContainer="flex items-center -ml-0.5"
                          >
                            <CalendarArrowDownIcon className="size-4 shrink-0" />
                            <div className="flex shrink min-w-0 items-center gap-0.5 overflow-hidden">
                              <p className="shrink min-w-0 overflow-hidden overflow-ellipsis">
                                {field.value ? field.value : `Yıl >=`}
                              </p>
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="p-1 w-[--radix-popper-anchor-width]">
                          {field.value && (
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
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="yearLte"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="sr-only">Yıl Küçüktür</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          if (v === clearButtonText) {
                            clearYearLte();
                            return;
                          }
                          const year = parseInt(v);
                          if (year !== yearLteQP) {
                            setYearLteQP(year);
                          }
                          field.onChange(year);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger
                            className="py-2 rounded-l-none -ml-[0.5px]"
                            classNameInnerContainer="flex items-center -ml-0.5"
                          >
                            <CalendarArrowDownIcon className="size-4 shrink-0" />
                            <div className="flex shrink min-w-0 items-center gap-0.5 overflow-hidden">
                              <p className="shrink min-w-0 overflow-hidden overflow-ellipsis">
                                {field.value ? field.value : `Yıl <=`}
                              </p>
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="p-1 w-[--radix-popper-anchor-width]">
                          {field.value && (
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
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
                <FormField
                  control={form.control}
                  name="universities"
                  render={({}) => (
                    <MultiSelectFormItem
                      label="Üniversite"
                      className="w-full"
                      Icon={LandmarkIcon}
                      commandButtonText={
                        <div className="flex-1 min-w-0 flex items-center">
                          <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                            Üniversite
                          </p>
                          {selectedUniversities &&
                            selectedUniversities.length > 0 && (
                              <p className="ml-1.5 shrink-0 bg-warning/16 text-warning text-xs px-1 py-px font-bold rounded-sm">
                                {selectedUniversities.length}
                              </p>
                            )}
                        </div>
                      }
                      commandInputPlaceholder="Üniversite ara..."
                      commandEmptyText="Eşleşen yok"
                      isItemSelected={(v) =>
                        selectedUniversities?.includes(v) || false
                      }
                      items={universityOptions}
                      onSelectClear={
                        selectedUniversities && selectedUniversities.length > 0
                          ? clearUniversities
                          : undefined
                      }
                      onSelect={(v) => {
                        const newValue = toggleInArray(selectedUniversities, v);
                        if (universitiesQP.join(",") !== newValue.join(",")) {
                          setUniversitiesQP(newValue);
                        }
                        form.setValue("universities", newValue);
                      }}
                      clearLength={selectedUniversities?.length}
                    />
                  )}
                />
              </div>
              <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
                <FormField
                  control={form.control}
                  name="thesisTypes"
                  render={({}) => (
                    <MultiSelectFormItem
                      label="Tez Türü"
                      className="w-full"
                      Icon={ScrollTextIcon}
                      IconSetForItem={ThesisTypeIcon}
                      commandButtonText={
                        <div className="flex-1 min-w-0 flex items-center">
                          <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                            Tez Türü
                          </p>
                          {selectedThesisTypes &&
                            selectedThesisTypes.length > 0 && (
                              <p className="ml-1.5 shrink-0 bg-warning/16 text-warning text-xs px-1 py-px font-bold rounded-sm">
                                {selectedThesisTypes.length}
                              </p>
                            )}
                        </div>
                      }
                      commandInputPlaceholder="Tez türü ara..."
                      commandEmptyText="Eşleşen yok"
                      isItemSelected={(v) =>
                        selectedThesisTypes?.includes(v) || false
                      }
                      items={thesisTypeOptions}
                      onSelect={(v) => {
                        const newValue = toggleInArray(selectedThesisTypes, v);
                        if (thesisTypesQP.join(",") !== newValue.join(",")) {
                          setThesisTypesQP(newValue);
                        }
                        form.setValue("thesisTypes", newValue);
                      }}
                      onSelectClear={
                        selectedThesisTypes && selectedThesisTypes.length > 0
                          ? clearThesisTypes
                          : undefined
                      }
                      clearLength={selectedThesisTypes?.length}
                    />
                  )}
                />
              </div>
              <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
                <FormField
                  control={form.control}
                  name="languages"
                  render={({}) => (
                    <MultiSelectFormItem
                      label="Dil"
                      className="w-full"
                      Icon={GlobeIcon}
                      IconSetForItem={LanguageIcon}
                      iconSetForItemClassName="rounded-full"
                      commandButtonText={
                        <div className="flex-1 min-w-0 flex items-center">
                          <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                            Dil
                          </p>
                          {selectedLanguages &&
                            selectedLanguages.length > 0 && (
                              <p className="ml-1.5 shrink-0 bg-warning/16 text-warning text-xs px-1 py-px font-bold rounded-sm">
                                {selectedLanguages.length}
                              </p>
                            )}
                        </div>
                      }
                      commandInputPlaceholder="Dil ara..."
                      commandEmptyText="Eşleşen yok"
                      isItemSelected={(v) =>
                        selectedLanguages?.includes(v) || false
                      }
                      items={languageOptions}
                      onSelect={(v) => {
                        const newValue = toggleInArray(selectedLanguages, v);
                        if (languagesQP.join(",") !== newValue.join(",")) {
                          setLanguagesQP(newValue);
                        }
                        form.setValue("languages", newValue);
                      }}
                      onSelectClear={
                        selectedLanguages && selectedLanguages.length > 0
                          ? clearLanguages
                          : undefined
                      }
                      clearLength={selectedLanguages?.length}
                    />
                  )}
                />
              </div>
              <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
                <FormField
                  control={form.control}
                  name="advisors"
                  render={({}) => (
                    <MultiSelectFormItem
                      label="Danışman"
                      className="w-full"
                      Icon={UserIcon}
                      commandButtonText={
                        <div className="flex-1 min-w-0 flex items-center">
                          <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
                            Danışman
                          </p>
                          {selectedAdvisors && selectedAdvisors.length > 0 && (
                            <p className="ml-1.5 shrink-0 bg-warning/16 text-warning text-xs px-1 py-px font-bold rounded-sm">
                              {selectedAdvisors.length}
                            </p>
                          )}
                        </div>
                      }
                      commandInputPlaceholder="Danışman ara..."
                      commandEmptyText="Eşleşen yok"
                      isItemSelected={(v) =>
                        selectedAdvisors?.includes(v) || false
                      }
                      items={universityOptions}
                      onSelectClear={
                        selectedAdvisors && selectedAdvisors.length > 0
                          ? clearAdvisors
                          : undefined
                      }
                      onSelect={(v) => {
                        const newValue = toggleInArray(selectedAdvisors, v);
                        if (advisorsQP.join(",") !== newValue.join(",")) {
                          setAdvisorsQP(newValue);
                        }
                        form.setValue("advisors", newValue);
                      }}
                      clearLength={selectedAdvisors?.length}
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
