"use client";

import BroomIcon from "@/components/icons/broom";
import LanguageIcon from "@/components/icons/language";
import ThesisTypeIcon from "@/components/icons/thesis-type";
import { useIsTouchscreen } from "@/components/providers/is-touchscreen-provider";
import { searchLikePageParams } from "@/components/search/constants-client";
import MultiSelectFormItem from "@/components/search/multi-select-form-item";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormHeader,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import { useAsyncRouterPush } from "@/lib/hooks/use-async-router-push";
import { TGetLanguagesResult } from "@/server/meili/repo/language";
import { TGetThesisTypesResult } from "@/server/meili/repo/thesis-type";
import { TGetUniversitiesResult } from "@/server/meili/repo/university";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounce } from "@uidotdev/usehooks";
import {
  ChevronUpIcon,
  GlobeIcon,
  LandmarkIcon,
  LoaderIcon,
  ScrollTextIcon,
  SearchIcon,
  SettingsIcon,
  XIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const SearchThesesSchema = z.object({
  query: z.string(),
  languages: z.array(z.string()),
  universities: z.array(z.string()),
  thesisTypes: z.array(z.string()),
  offset: z.number(),
});

type Props = {
  className?: string;
  variant: "home" | "search";
  languages: TGetLanguagesResult["hits"];
  universities: TGetUniversitiesResult["hits"];
  thesisTypes: TGetThesisTypesResult["hits"];
};

export default function SearchInput({
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
  const searchParams = useSearchParams();

  const [queryIsLoading, queryStartTransition] = useTransition();
  const [query, setQuery] = useQueryState("q", {
    ...searchLikePageParams.q,
    startTransition: queryStartTransition,
  });

  const [languagesQP, setLanguagesQP] = useQueryState(
    "languages",
    searchLikePageParams["languages"]
  );
  const [universitiesQP, setUniversitiesQP] = useQueryState(
    "universities",
    searchLikePageParams["universities"]
  );
  const [thesisTypesQP, setThesisTypesQP] = useQueryState(
    "thesis_types",
    searchLikePageParams["thesis_types"]
  );
  const [advancedSearch, setAdvancedSearch] = useQueryState(
    "advanced",
    searchLikePageParams["advanced"]
  );
  const [offsetQP, setOffsetQP] = useQueryState(
    "offset",
    searchLikePageParams["offset"]
  );

  const [asyncPush, isPendingAsyncPush] = useAsyncRouterPush();
  const form = useForm<z.infer<typeof SearchThesesSchema>>({
    resolver: zodResolver(SearchThesesSchema),
    defaultValues: {
      query,
      languages: languagesQP,
      universities: universitiesQP,
      thesisTypes: thesisTypesQP,
      offset: offsetQP,
    },
  });

  const queryInput = form.watch("query");
  const selectedLanguages = form.watch("languages");
  const selectedUniversities = form.watch("universities");
  const selectedThesisTypes = form.watch("thesisTypes");
  const offset = form.watch("offset");

  const totalSelectedCount = useMemo(() => {
    let total = 0;
    if (selectedLanguages) total += selectedLanguages.length;
    if (selectedUniversities) total += selectedUniversities.length;
    if (selectedThesisTypes) total += selectedThesisTypes.length;
    return total;
  }, [selectedLanguages, selectedUniversities, selectedThesisTypes]);

  const hasFilters = useMemo(() => {
    return (
      (selectedLanguages && selectedLanguages.length > 0) ||
      (selectedUniversities && selectedUniversities.length > 0) ||
      (selectedThesisTypes && selectedThesisTypes.length > 0)
    );
  }, [selectedUniversities, selectedLanguages, selectedThesisTypes]);

  const debouncedQueryInput = useDebounce(queryInput, 150);

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

  useEffect(() => {
    if (languagesQP.join(",") === selectedLanguages.join(",")) return;
    setLanguagesQP(selectedLanguages);
  }, [selectedLanguages, variant, setLanguagesQP, languagesQP]);

  useEffect(() => {
    if (universitiesQP.join(",") === selectedUniversities.join(",")) return;
    setUniversitiesQP(selectedUniversities);
  }, [selectedUniversities, variant, setUniversitiesQP, universitiesQP]);

  useEffect(() => {
    if (thesisTypesQP.join(",") === selectedThesisTypes.join(",")) return;
    setThesisTypesQP(selectedThesisTypes);
  }, [selectedThesisTypes, variant, setThesisTypesQP, thesisTypesQP]);

  useEffect(() => {
    if (offsetQP === offset) return;
    setOffsetQP(offset);
  }, [offset, offsetQP, setOffsetQP]);

  async function onSubmit(data: z.infer<typeof SearchThesesSchema>) {
    if (variant === "home") {
      const paramStr = searchParams.toString();
      let tries = 0;
      while (queryIsLoading && tries < 100) {
        await new Promise((r) => setTimeout(r, 10));
        tries++;
      }
      await asyncPush(`/search${paramStr ? `?${paramStr}` : ""}`);
      return;
    }
    if (variant === "search") {
      setQuery(data.query);
      setLanguagesQP(data.languages);
      setUniversitiesQP(data.universities);
      setThesisTypesQP(data.thesisTypes);
      setOffsetQP(data.offset);
      return;
    }
  }

  function clearQueryInput() {
    form.setValue("query", "");
    form.setFocus("query");
  }

  function clearAllFilters() {
    if (variant === "home") {
      setLanguagesQP([]);
      setUniversitiesQP([]);
      setThesisTypesQP([]);
      form.setValue("languages", []);
      form.setValue("universities", []);
      form.setValue("thesisTypes", []);
      return;
    }
    if (variant === "search") {
      form.setValue("languages", []);
      form.setValue("universities", []);
      form.setValue("thesisTypes", []);
    }
  }

  const isTouchScreen = useIsTouchscreen();
  const formRef = useRef(form);

  useEffect(() => {
    setTimeout(() => {
      if (isTouchScreen) return;
      document.getElementById("main-search-input")?.focus();
      const input = document.getElementById(
        "main-search-input"
      ) as HTMLInputElement | null;
      input?.setSelectionRange(input.value.length, input.value.length);
    });
  }, [isTouchScreen, formRef]);

  return (
    <Form {...form}>
      <form
        data-pending={isPendingAsyncPush ? true : undefined}
        onSubmit={form.handleSubmit(onSubmit)}
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
              <FormHeader className="sr-only">
                <FormLabel>Ara</FormLabel>
              </FormHeader>
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
                {isPendingAsyncPush && (
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
            <Button disabled={isPendingAsyncPush} className="py-2 px-6">
              <p className="min-w-0 shrink group-data-[pending]/form:opacity-0">
                Ara
              </p>
              {isPendingAsyncPush && (
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
              {hasFilters && (
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
                    {totalSelectedCount}
                  </p>
                </Button>
              )}
            </div>
          </div>
          {/* Advanced settings */}
          {advancedSearch && (
            <div className="w-full max-w-3xl flex justify-center flex-wrap pt-2 pb-3">
              <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
                <FormField
                  control={form.control}
                  name="universities"
                  render={({}) => (
                    <MultiSelectFormItem
                      className="w-full"
                      Icon={LandmarkIcon}
                      commandButtonText={
                        <div className="flex-1 min-w-0 flex items-center">
                          <p className="shrink min-w-0 overflow-ellipsis overflow-hidden">
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
                      onSelect={(v) =>
                        form.setValue(
                          "universities",
                          toggleValueInArray(selectedUniversities, v)
                        )
                      }
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
                      className="w-full"
                      Icon={ScrollTextIcon}
                      IconSetForItem={ThesisTypeIcon}
                      commandButtonText={
                        <div className="flex-1 min-w-0 flex items-center">
                          <p className="shrink min-w-0 overflow-ellipsis overflow-hidden">
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
                      onSelect={(v) =>
                        form.setValue(
                          "thesisTypes",
                          toggleValueInArray(selectedThesisTypes, v)
                        )
                      }
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
                      className="w-full"
                      Icon={GlobeIcon}
                      IconSetForItem={LanguageIcon}
                      iconSetForItemClassName="rounded-full"
                      commandButtonText={
                        <div className="flex-1 min-w-0 flex items-center">
                          <p className="shrink min-w-0 overflow-ellipsis overflow-hidden">
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
                      onSelect={(v) =>
                        form.setValue(
                          "languages",
                          toggleValueInArray(selectedLanguages, v)
                        )
                      }
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

function toggleValueInArray<T>(arr: T[], item: T) {
  if (!arr) return [item];
  if (arr.includes(item)) {
    return removeValueFromArray(arr, item);
  }
  return addValueToArray(arr, item);
}

function removeValueFromArray<T>(arr: T[], item: T) {
  if (!arr) return [];
  return arr.filter((i) => i !== item);
}

function addValueToArray<T>(arr: T[], item: T) {
  if (!arr) return [item];
  return [...arr, item];
}
