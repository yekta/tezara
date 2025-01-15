"use client";

import {
  Form,
  FormField,
  FormHeader,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchIcon, XIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { parseAsString, useQueryState } from "nuqs";
import { useAsyncRouterPush } from "@/lib/hooks/use-async-router-push";
import { Button } from "@/components/ui/button";

const SearchThesesSchema = z.object({
  query: z.string().nonempty(),
});

type Props = {
  className?: string;
  variant: "home" | "search";
};

export default function SearchBox({ className, variant }: Props) {
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
  const [asyncPush, isPendingAsyncPush] = useAsyncRouterPush();
  const form = useForm<z.infer<typeof SearchThesesSchema>>({
    resolver: zodResolver(SearchThesesSchema),
    defaultValues: {
      query,
    },
  });
  const queryInput = form.watch("query");

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
                <SearchIcon className="size-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-more-foreground" />
                <Input
                  className="w-full pl-10 bg-background-hover"
                  placeholder="Tez, yazar, veya danışman ara..."
                  {...field}
                />
                {queryInput !== undefined &&
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
              </div>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
