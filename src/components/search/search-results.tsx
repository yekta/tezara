"use client";

import FileExtensionIcon from "@/components/icons/file-extension";
import { useSearchResults } from "@/components/search/search-results-provider";
import { Button } from "@/components/ui/button";
import { LoaderIcon, SearchIcon, TriangleAlertIcon } from "lucide-react";

type Props = {
  className?: string;
};

export default function SearchResults({}: Props) {
  const { data, isPending, isLoadingError } = useSearchResults();
  return (
    <div className="w-full flex flex-col">
      {data && data.length > 0 && (
        <div className="w-full flex flex-wrap items-start mt-6 gap-2">
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
            <LoaderIcon className="size-6 animate-spin" />
            <p className="w-full text-balance text-center mt-1.5 font-medium leading-tight">
              Yükleniyor...
            </p>
          </div>
        )}
        {isLoadingError && (
          <div className="w-full flex flex-col items-center justify-center py-8 text-destructive text-sm">
            <TriangleAlertIcon className="size-6" />
            <p className="w-full text-balance text-center mt-1.5 font-medium leading-tight">
              Birşeyler ters gitti
            </p>
          </div>
        )}
        {data && data.length === 0 && (
          <div className="w-full flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
            <SearchIcon className="size-6" />
            <p className="w-full text-balance text-center mt-1.5 font-medium leading-tight">
              Sonuç bulunamadı
            </p>
          </div>
        )}
        {data && data.length > 0 && (
          <div className="w-full flex flex-col overflow-auto py-3">
            {data.map((result) => (
              <div key={result.id} className="py-3 border-b flex flex-col">
                <p className="text-base font-semibold leading-snug">
                  {result.titleTurkish}
                </p>
                <p className="text-base mt-1 leading-snug">
                  {result.authorName}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
