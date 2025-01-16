"use client";

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
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronUpIcon,
  LoaderIcon,
  SearchIcon,
  SettingsIcon,
  XIcon,
} from "lucide-react";
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const SearchThesesSchema = z.object({
  query: z.string(),
});

type Props = {
  className?: string;
  variant: "home" | "search";
};

export default function SearchInput({ className, variant }: Props) {
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
  const [asyncPush, isPendingAsyncPush] = useAsyncRouterPush();
  const form = useForm<z.infer<typeof SearchThesesSchema>>({
    resolver: zodResolver(SearchThesesSchema),
    defaultValues: {
      query,
    },
  });
  const queryInput = form.watch("query");
  const [advancedSearch, setAdvancedSearch] = useQueryState(
    "advanced",
    parseAsBoolean.withDefault(false)
  );

  useEffect(() => {
    if (variant !== "home") return;
    setQuery(queryInput);
  }, [queryInput, variant, setQuery]);

  async function onSubmit(data: z.infer<typeof SearchThesesSchema>) {
    if (variant === "home") {
      await asyncPush(`/search?q=${data.query}`);
      return;
    }
    if (variant === "search") {
      setQuery(data.query);
      return;
    }
  }

  function clearQueryInput() {
    form.setValue("query", "");
    form.setFocus("query");
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("w-full flex flex-col items-center", className)}
      >
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem className="w-128 max-w-full">
              <FormHeader className="sr-only">
                <FormLabel>Ara</FormLabel>
              </FormHeader>
              <div className="w-full relative">
                <SearchIcon className="size-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-more-foreground" />
                <Input
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
                      className="absolute text-muted-foreground right-1 top-1/2 transform -translate-y-1/2"
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

        <div
          data-advanced={advancedSearch ? true : undefined}
          className="w-full flex flex-col items-center mt-2 group"
        >
          <div className="max-w-full flex justify-center">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground font-semibold"
              onClick={() => setAdvancedSearch((a) => !a)}
            >
              <div className="size-5 -ml-1 transform transition group-data-[advanced]:rotate-90">
                {advancedSearch ? (
                  <ChevronUpIcon className="size-full -rotate-90" />
                ) : (
                  <SettingsIcon className="size-full" />
                )}
              </div>
              <p className="shrink min-w-0">Gelişmiş Arama</p>
            </Button>
          </div>
          {advancedSearch && (
            <div className="w-full max-w-3xl flex justify-center flex-wrap py-2 gap-3">
              <p>Seçenek Eklenecek</p>
              <p>Seçenek Eklenecek</p>
              <p>Seçenek Eklenecek</p>
              <p>Seçenek Eklenecek</p>
              <p>Seçenek Eklenecek</p>
              <p>Seçenek Eklenecek</p>
              <p>Seçenek Eklenecek</p>
              <p>Seçenek Eklenecek</p>
              <p>Seçenek Eklenecek</p>
              <p>Seçenek Eklenecek</p>
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
