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
import { SearchIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const SearchThesesSchema = z.object({
  query: z.string().nonempty(),
});

type Props = {
  className?: string;
};

export default function SearchBox({ className }: Props) {
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
  const form = useForm<z.infer<typeof SearchThesesSchema>>({
    resolver: zodResolver(SearchThesesSchema),
    defaultValues: {
      query,
    },
  });

  function onSubmit(data: z.infer<typeof SearchThesesSchema>) {
    toast("Arama yapılıyor...", {
      description: `Aranan: ${data.query}`,
      duration: 3000,
    });
    setQuery(data.query);
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
                  placeholder="Tez ara..."
                  {...field}
                />
              </div>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
