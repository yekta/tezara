"use client";

import FileExtensionIcon from "@/components/icons/file-extension";
import { useSearchResults } from "@/components/search/search-results-provider";
import { Button, LinkButton } from "@/components/ui/button";
import { LoaderIcon, SearchIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  className?: string;
};

export default function SearchResults({}: Props) {
  const { data, isPending, isLoadingError } = useSearchResults();
  return (
    <div className="w-full flex flex-col">
      {data && data.length > 0 && (
        <div className="w-full flex flex-wrap items-start mt-6 gap-1.5">
          <Button size="sm" variant="success">
            <FileExtensionIcon className="size-5 -ml-1.5" variant="csv" />
            <p className="shrink min-w-0">Tablo Olarak İndir</p>
          </Button>
          <Button size="sm">
            <FileExtensionIcon className="size-5 -ml-1.5" variant="json" />
            <p className="shrink min-w-0">JSON Olarak İndir</p>
          </Button>
        </div>
      )}
      <div className="w-full flex flex-col">
        {isPending && (
          <div className="w-full flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
            <LoaderIcon className="size-7 animate-spin" />
            <p className="w-full text-balance text-center mt-1.5 font-medium leading-tight">
              Yükleniyor...
            </p>
          </div>
        )}
        {isLoadingError && (
          <div className="w-full flex flex-col items-center justify-center py-8 text-destructive text-sm">
            <TriangleAlertIcon className="size-7" />
            <p className="w-full text-balance text-center mt-1.5 font-medium leading-tight">
              Birşeyler ters gitti
            </p>
          </div>
        )}
        {data && data.length === 0 && (
          <div className="w-full flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
            <SearchIcon className="size-7" />
            <p className="w-full text-balance text-center mt-1.5 font-medium leading-tight">
              Sonuç bulunamadı
            </p>
          </div>
        )}
        {data && data.length > 0 && (
          <div className="w-full flex flex-col mt-6">
            {data.map((result) => (
              <div
                key={result.id}
                className="py-3 first-of-type:border-t border-b flex flex-row items-start gap-4"
              >
                <LinkButton
                  variant="ghost"
                  href={`/thesis/${result.id}`}
                  className="flex -mt-0.5 flex-col shrink-0 min-w-12 text-xs font-mono justify-start items-start gap-0.5 px-1.5 py-1 rounded-md"
                >
                  <p className="flex-1 min-w-0 font-medium leading-tight font-sans text-muted-foreground">
                    Tez No
                  </p>
                  <p className="flex-1 min-w-0 font-bold">{result.id}</p>
                </LinkButton>
                <div className="flex-1 min-w-0 flex flex-col">
                  <p className="text-base font-semibold leading-snug">
                    {result.titleTurkish}
                  </p>
                  <p className="text-base mt-1 leading-snug">
                    {result.authorName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
