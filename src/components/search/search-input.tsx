"use client";

import BroomIcon from "@/components/icons/broom";
import LanguageIcon from "@/components/icons/language";
import ThesisTypeIcon from "@/components/icons/thesis-type";
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
import { AppRouterOutputs } from "@/server/trpc/api/root";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpIcon,
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
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  useQueryState,
} from "nuqs";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const SearchThesesSchema = z.object({
  query: z.string(),
  languages: z.array(z.string()),
  universities: z.array(z.string()),
  thesisTypes: z.array(z.string()),
});

type Props = {
  className?: string;
  variant: "home" | "search";
  languages: AppRouterOutputs["main"]["getLanguages"];
  universities: AppRouterOutputs["main"]["getUniversities"];
  thesisTypes: AppRouterOutputs["main"]["getThesisTypes"];
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
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
  const [languagesQP, setLanguagesQP] = useQueryState(
    "languages",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [universitiesQP, setUniversitiesQP] = useQueryState(
    "universities",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [thesisTypesQP, setThesisTypesQP] = useQueryState(
    "thesis-types",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [advancedSearch, setAdvancedSearch] = useQueryState(
    "advanced",
    parseAsBoolean.withDefault(false)
  );

  const [asyncPush, isPendingAsyncPush] = useAsyncRouterPush();
  const form = useForm<z.infer<typeof SearchThesesSchema>>({
    resolver: zodResolver(SearchThesesSchema),
    defaultValues: {
      query,
      languages: languagesQP,
      universities: universitiesQP,
      thesisTypes: thesisTypesQP,
    },
  });

  const queryInput = form.watch("query");
  const selectedLanguages = form.watch("languages");
  const selectedUniversities = form.watch("universities");
  const selectedThesisTypes = form.watch("thesisTypes");
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

  useEffect(() => {
    if (variant !== "home") return;
    setQuery(queryInput);
  }, [queryInput, variant, setQuery]);

  useEffect(() => {
    if (variant !== "home") return;
    setLanguagesQP(selectedLanguages);
  }, [selectedLanguages, variant, setLanguagesQP]);

  useEffect(() => {
    if (variant !== "home") return;
    setUniversitiesQP(selectedUniversities);
  }, [selectedUniversities, variant, setUniversitiesQP]);

  useEffect(() => {
    if (variant !== "home") return;
    setThesisTypesQP(selectedThesisTypes);
  }, [selectedThesisTypes, variant, setThesisTypesQP]);

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
      setThesisTypesQP(data.thesisTypes);
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

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("w-full flex flex-col items-center", className)}
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
              <div
                data-has-filter={hasFilters ? true : undefined}
                className="w-full relative group/input"
              >
                <SearchIcon className="size-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-more-foreground" />
                <Input
                  type="search"
                  enterKeyHint="search"
                  disabled={isPendingAsyncPush}
                  className="w-full pl-8.5 pr-12 group-data-[has-filter]/input:pr-18 bg-background-hover"
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
                      className="absolute size-8 text-muted-foreground right-1.5 top-1/2 transform -translate-y-1/2 group-data-[has-filter]/input:right-9.5"
                      type="button"
                      onClick={clearQueryInput}
                    >
                      <XIcon className="size-5" />
                    </Button>
                  )}
                {hasFilters && !isPendingAsyncPush && (
                  <Button
                    aria-label="Ara"
                    size="icon"
                    className="absolute size-8 right-1.5 top-1/2 transform -translate-y-1/2"
                  >
                    <ArrowUpIcon className="size-6" />
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
          <div className="max-w-full flex justify-center">
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
                <p className="shrink min-w-0">
                  Temizle
                  <span className="text-warning/75 font-medium text-sm">
                    {" "}
                    ({totalSelectedCount})
                  </span>
                </p>
              </Button>
            )}
          </div>
          {/* Advanced settings */}
          {advancedSearch && (
            <div className="w-full max-w-3xl flex justify-center flex-wrap pt-2 pb-3">
              <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1">
                <FormField
                  control={form.control}
                  name="universities"
                  render={({ field }) => (
                    <MultiSelectFormItem
                      className="w-full"
                      Icon={LandmarkIcon}
                      commandButtonText={
                        <>
                          Üniversite
                          {selectedUniversities &&
                            selectedUniversities.length > 0 && (
                              <span className="text-muted-foreground font-medium">
                                {` (${selectedUniversities.length})`}
                              </span>
                            )}
                        </>
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
                  render={({ field }) => (
                    <MultiSelectFormItem
                      className="w-full"
                      Icon={ScrollTextIcon}
                      IconSetForItem={ThesisTypeIcon}
                      commandButtonText={
                        <>
                          Tez Türü
                          {selectedThesisTypes &&
                            selectedThesisTypes.length > 0 && (
                              <span className="text-muted-foreground font-medium">
                                {` (${selectedThesisTypes.length})`}
                              </span>
                            )}
                        </>
                      }
                      commandInputPlaceholder="Tez ürü ara..."
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
                  render={({ field }) => (
                    <MultiSelectFormItem
                      className="w-full"
                      Icon={GlobeIcon}
                      IconSetForItem={LanguageIcon}
                      iconSetForItemClassName="rounded-full"
                      commandButtonText={
                        <>
                          Dil
                          {selectedLanguages &&
                            selectedLanguages.length > 0 && (
                              <span className="text-muted-foreground font-medium">
                                {` (${selectedLanguages.length})`}
                              </span>
                            )}
                        </>
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
