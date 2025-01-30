"use client";

import { useSubjectsPageParam } from "@/app/subjects/_components/query-param-provider";
import { useSubjectsPage } from "@/app/subjects/_components/subjects-page-provider";
import { SearchIcon } from "@/components/icons/search-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import { LoaderIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

type Props = {
  className?: string;
};

const subjectSearchInputId = "subject-search-input";

const focusToInput = () => {
  const input = document.getElementById(
    subjectSearchInputId
  ) as HTMLInputElement | null;
  input?.focus();
  input?.setSelectionRange(input.value.length, input.value.length);
};

export default function SearchInput({ className }: Props) {
  const { isFetching, isPending } = useSubjectsPage();
  const isPendingOrFetching = isPending || isFetching;
  const [query, setQuery] = useSubjectsPageParam.q();
  const debouncedSetQueryQP = useDebounceCallback(setQuery, 150);
  const [queryInputValue, setQueryInputValue] = useState(query);

  useEffect(() => {
    if (!queryInputValue) {
      setQuery("");
      return;
    }
    debouncedSetQueryQP(queryInputValue);
    // This is a stable function, no need to add it to deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInputValue]);

  const clearQuery = () => {
    setQueryInputValue("");
    setQuery("");
  };

  return (
    <div
      className={cn("relative group/input flex-1 shrink min-w-0", className)}
    >
      <div className="size-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-more-foreground">
        {isPendingOrFetching ? (
          <LoaderIcon className="size-full animate-spin" />
        ) : (
          <SearchIcon className="size-full" />
        )}
      </div>
      <Input
        name={subjectSearchInputId}
        id={subjectSearchInputId}
        aria-label="Ara"
        fadeOnDisabled={false}
        type="search"
        enterKeyHint="search"
        className="w-full pl-8.5 pr-12 rounded-xl"
        placeholder="Konu ara..."
        value={queryInputValue}
        onChange={(e) => setQueryInputValue(e.target.value)}
      />
      {queryInputValue !== undefined &&
        queryInputValue !== "" &&
        queryInputValue !== null && (
          <Button
            size="icon"
            aria-label="Aramayı temizle"
            variant="ghost"
            className="absolute rounded-lg size-9 text-muted-foreground right-1 top-1/2 transform -translate-y-1/2"
            type="button"
            onClick={() => {
              clearQuery();
              focusToInput();
            }}
          >
            <XIcon className="size-5" />
          </Button>
        )}
    </div>
  );
}
