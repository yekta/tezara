"use client";

import FileExtensionIcon from "@/components/icons/file-extension";
import { formatForDownload } from "@/components/search/format-for-download";
import { useSearchResults } from "@/components/search/search-results-provider";
import ThesisSearchResultRow from "@/components/search/thesis-search-result-row";
import { Button } from "@/components/ui/button";
import { Parser } from "@json2csv/plainjs";
import { LoaderIcon, SearchIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";

type Props = {
  className?: string;
};

export default function SearchResults({}: Props) {
  const { data, isPending, isLoadingError, bulkDownload } = useSearchResults();
  const [isPendingCsvDownload, setIsPendingDownload] = useState(false);
  const [isPendingJsonDownload, setIsPendingJsonDownload] = useState(false);
  const isPendingDownload = isPendingCsvDownload || isPendingJsonDownload;

  async function downloadCsv() {
    setIsPendingDownload(true);
    try {
      const res = await bulkDownload();
      const formatted = formatForDownload(res.hits);
      const parser = new Parser();
      const csv = parser.parse(formatted);

      // Convert CSV to a Blob
      const csvBlob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

      setIsPendingDownload(false);

      const name = `search-results-${Date.now()}.csv`;
      downloadAndClean(name, csvBlob);
    } catch (error) {
      console.log(error);
      setIsPendingDownload(false);
    }
  }

  async function downloadJson() {
    setIsPendingJsonDownload(true);
    try {
      const res = await bulkDownload();
      const formatted = formatForDownload(res.hits);
      // Convert the formatted JSON to a Blob
      const jsonBlob = new Blob([JSON.stringify(formatted, null, 2)], {
        type: "application/json",
      });

      setIsPendingJsonDownload(false);

      const name = `search-results-${Date.now()}.json`;
      downloadAndClean(name, jsonBlob);
    } catch (error) {
      console.log(error);
      setIsPendingJsonDownload(false);
    }
  }

  function downloadAndClean(name: string, blob: Blob) {
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = name;

    // Trigger the download
    document.body.appendChild(downloadLink);
    downloadLink.click();

    // Clean up
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadLink.href);
  }

  return (
    <div className="w-full flex flex-col pt-6">
      {((!data && isPending) ||
        (data && data.hits && data.hits.length > 0)) && (
        <div
          data-pending={isPending ? true : undefined}
          className="w-full flex flex-col items-start group/header"
        >
          <p
            className="max-w-full font-semibold text-sm text-muted-foreground px-1 text-balance
            group-data-[pending]/header:text-transparent
            group-data-[pending]/header:animate-skeleton
            group-data-[pending]/header:bg-muted-foreground
            group-data-[pending]/header:rounded-sm
            "
          >
            <span>Sonuç: </span>
            {!data ? (
              <span>10,000</span>
            ) : (
              <span className="text-foreground">
                {data.estimatedTotalHits.toLocaleString()}
              </span>
            )}
            <span className="text-muted-more-foreground group-data-[pending]/header:text-transparent px-[0.65ch]">
              |
            </span>
            <span>Gösterilen: </span>
            {!data ? (
              <span className="pr-[0.65ch]">10</span>
            ) : (
              <span className="text-foreground">
                {data.hits.length.toLocaleString()}
              </span>
            )}
            <span className="text-muted-more-foreground group-data-[pending]/header:text-transparent px-[0.65ch]">
              |
            </span>
            <span>Süre: </span>
            <span className="text-foreground group-data-[pending]/header:text-transparent">
              {!data ? "0.001" : data.processingTimeMs / 1000} sn.
            </span>
          </p>
          <div className="w-full flex flex-wrap items-start gap-1.5 mt-3">
            <Button
              onClick={() => downloadCsv()}
              disabled={!data || isPendingCsvDownload || isPendingDownload}
              size="sm"
              variant="success"
              fadeOnDisabled={
                !data ? false : isPendingCsvDownload ? false : true
              }
              className={`${
                isPendingCsvDownload ? "bg-success/75 overflow-hidden" : ""
              } group-data-[pending]/header:animate-skeleton`}
            >
              {isPendingCsvDownload && (
                <div className="absolute left-0 top-0 origin-left bg-success h-full w-full animate-loading-bar" />
              )}
              <div className="size-5 -ml-1.5 relative">
                {!isPendingCsvDownload && (
                  <FileExtensionIcon
                    className="size-full group-data-[pending]/header:opacity-0"
                    variant="csv"
                  />
                )}
                {isPendingCsvDownload && (
                  <LoaderIcon className="size-full animate-spin" />
                )}
              </div>
              <p className="shrink min-w-0 relative group-data-[pending]/header:text-transparent">
                {isPendingCsvDownload ? "İndiriliyor" : "Tablo İndir"}
              </p>
            </Button>
            <Button
              onClick={() => downloadJson()}
              disabled={!data || isPendingJsonDownload || isPendingDownload}
              size="sm"
              fadeOnDisabled={
                !data ? false : isPendingJsonDownload ? false : true
              }
              className={`${
                isPendingJsonDownload ? "bg-primary/75 overflow-hidden" : ""
              } group-data-[pending]/header:animate-skeleton`}
            >
              {isPendingJsonDownload && (
                <div className="absolute left-0 top-0 origin-left bg-primary h-full w-full animate-loading-bar" />
              )}
              <div className="size-5 -ml-1.5 relative">
                {!isPendingJsonDownload && (
                  <FileExtensionIcon
                    className="size-full group-data-[pending]/header:opacity-0"
                    variant="json"
                  />
                )}
                {isPendingJsonDownload && (
                  <LoaderIcon className="size-full animate-spin" />
                )}
              </div>
              <p className="shrink min-w-0 relative group-data-[pending]/header:text-transparent">
                {isPendingJsonDownload ? "İndiriliyor" : "JSON İndir"}
              </p>
            </Button>
          </div>
        </div>
      )}
      <div className="w-full flex flex-col">
        {!data && !isPending && isLoadingError && (
          <div className="w-full flex flex-col items-center justify-center py-8 text-destructive text-sm">
            <TriangleAlertIcon className="size-7" />
            <p className="w-full text-balance text-center mt-1.5 font-semibold leading-tight">
              Birşeyler ters gitti
            </p>
          </div>
        )}
        {data && data.hits && data.hits.length === 0 && (
          <div className="w-full flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
            <SearchIcon className="size-7" />
            <p className="w-full text-balance text-center mt-1.5 font-semibold leading-tight">
              Sonuç bulunamadı
            </p>
          </div>
        )}
        {((!data && isPending) ||
          (data && data.hits && data.hits.length > 0)) && (
          <div className="w-full flex flex-col pt-4.5">
            <div className="w-full flex flex-col">
              {data
                ? data.hits.map((i, index) => (
                    <ThesisSearchResultRow
                      key={`${i.id}-${index}`}
                      thesis={i}
                    />
                  ))
                : Array.from({ length: 20 }).map((i, index) => (
                    <ThesisSearchResultRow key={index} isPlaceholder />
                  ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
