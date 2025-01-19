"use client";

import FileExtensionIcon from "@/components/icons/file-extension";
import { formatForDownload } from "@/components/search/format-for-download";
import { useSearchResults } from "@/components/search/search-results-provider";
import ThesisSearchResultRow from "@/components/search/thesis-search-result-row";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/components/ui/utils";
import { Parser } from "@json2csv/plainjs";
import { LoaderIcon, SearchIcon, TriangleAlertIcon } from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  className?: string;
};

export default function SearchResults({}: Props) {
  const searchResultsContext = useSearchResults();
  if (!searchResultsContext) {
    throw new Error(
      "SearchResultsProvider needs to wrap useSearchResults for it to work."
    );
  }
  const {
    data,
    bulkDownload,
    isPending,
    isLoadingError,
    currentPage,
    hasNext,
    hasPrev,
    goToNextPage,
    goToPrevPage,
    goToPage,
    firstPage,
    lastPage,
  } = searchResultsContext;
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

  const PaginationBar = useMemo(() => {
    const Component = ({ className }: { className?: string }) => (
      <Pagination
        className={cn(
          "w-full border-t border-b border-foreground/10 py-0.5",
          className
        )}
      >
        <PaginationContent className="w-full flex">
          <PaginationItem className="-ml-1">
            <PaginationPrevious
              disabled={!hasPrev}
              isButton
              onClick={goToPrevPage}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationPrevious
              variant="first"
              disabled={!hasPrev}
              isButton
              onClick={() => goToPage(firstPage)}
            />
          </PaginationItem>
          <p className="flex-1 px-2 text-sm overflow-hidden leading-tight overflow-ellipsis whitespace-nowrap text-center shrink min-w-0 font-semibold text-muted-foreground">
            Sayfa:{" "}
            <span className="text-foreground font-mono font-bold">
              {currentPage.toLocaleString()}
            </span>
          </p>
          <PaginationItem>
            <PaginationNext
              variant="last"
              isButton
              disabled={!hasNext}
              onClick={() => goToPage(lastPage)}
            />
          </PaginationItem>
          <PaginationItem className="-mr-1">
            <PaginationNext
              isButton
              disabled={!hasNext}
              onClick={goToNextPage}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    Component.displayName = "PaginationBar";
    return Component;
  }, [
    hasPrev,
    goToNextPage,
    goToPrevPage,
    currentPage,
    hasNext,
    firstPage,
    lastPage,
    goToPage,
  ]);

  const metricsPendingClassName =
    "group-data-[pending]/header:text-transparent group-data-[pending]/header:animate-skeleton group-data-[pending]/header:bg-foreground group-data-[pending]/header:rounded-sm";

  return (
    <div className="w-full flex flex-col pt-6">
      {((!data && isPending) || (data && data.hits)) && (
        <div
          data-pending={isPending ? true : undefined}
          className="w-full flex flex-col items-start group/header"
        >
          <p className="max-w-full font-semibold text-sm text-muted-foreground px-1 text-balance">
            <span>Eşleşen: </span>
            {!data ? (
              <span className={metricsPendingClassName}>900,000</span>
            ) : (
              <span className="text-foreground">
                {data.hits.length > 0 ? data.totalHits.toLocaleString() : 0}
              </span>
            )}
            <span className="text-foreground/30 px-[0.75ch]">|</span>
            <span>Gösterilen: </span>
            {!data ? (
              <span className={metricsPendingClassName}>10</span>
            ) : (
              <span className="text-foreground">
                {data.hits.length.toLocaleString()}
              </span>
            )}
            <span className="text-foreground/30 px-[0.75ch]">|</span>
            {!data ? (
              <span className={metricsPendingClassName}>0.001 sn.</span>
            ) : (
              <span className="text-foreground">
                {data.processingTimeMs / 1000} sn.
              </span>
            )}
          </p>
          <div className="w-full flex flex-wrap items-start gap-1.5 mt-3">
            <Button
              onClick={() => downloadCsv()}
              disabled={
                !data ||
                data.hits.length < 1 ||
                isPendingCsvDownload ||
                isPendingDownload
              }
              size="sm"
              variant="success"
              fadeOnDisabled={
                !data ? false : isPendingCsvDownload ? false : true
              }
              className={`${
                isPendingCsvDownload ? "bg-success/75 overflow-hidden" : ""
              }`}
            >
              {isPendingCsvDownload && (
                <div className="absolute left-0 top-0 origin-left bg-success h-full w-full animate-loading-bar" />
              )}
              <div className="size-5 -ml-1.5 relative">
                {!isPendingCsvDownload && (
                  <FileExtensionIcon className="size-full" variant="csv" />
                )}
                {isPendingCsvDownload && (
                  <LoaderIcon className="size-full animate-spin" />
                )}
              </div>
              <p className="shrink min-w-0 relative">
                {isPendingCsvDownload ? "İndiriliyor" : "Tablo İndir"}
              </p>
            </Button>
            <Button
              onClick={() => downloadJson()}
              disabled={
                !data ||
                data.hits.length < 1 ||
                isPendingJsonDownload ||
                isPendingDownload
              }
              size="sm"
              fadeOnDisabled={
                !data ? false : isPendingJsonDownload ? false : true
              }
              className={`${
                isPendingJsonDownload ? "bg-primary/75 overflow-hidden" : ""
              }`}
            >
              {isPendingJsonDownload && (
                <div className="absolute left-0 top-0 origin-left bg-primary h-full w-full animate-loading-bar" />
              )}
              <div className="size-5 -ml-1.5 relative">
                {!isPendingJsonDownload && (
                  <FileExtensionIcon className="size-full" variant="json" />
                )}
                {isPendingJsonDownload && (
                  <LoaderIcon className="size-full animate-spin" />
                )}
              </div>
              <p className="shrink min-w-0 relative">
                {isPendingJsonDownload ? "İndiriliyor" : "JSON İndir"}
              </p>
            </Button>
          </div>
        </div>
      )}
      <div className="w-full flex flex-col">
        <PaginationBar className="mt-5" />
        {!data && !isPending && isLoadingError && (
          <div className="w-full py-12 flex flex-col items-center justify-center text-destructive text-sm">
            <TriangleAlertIcon className="size-7" />
            <p className="w-full text-balance text-center mt-1.5 font-semibold leading-tight">
              Birşeyler ters gitti
            </p>
          </div>
        )}
        {data && data.hits && data.hits.length === 0 && (
          <div className="w-full py-12 flex flex-col items-center justify-center text-muted-foreground text-sm">
            <SearchIcon className="size-7" />
            <p className="w-full text-balance text-center mt-1.5 font-semibold leading-tight">
              Eşleşen yok
            </p>
          </div>
        )}
        {/* Result rows */}
        {((!data && isPending) ||
          (data && data.hits && data.hits.length > 0)) && (
          <div className="w-full flex flex-col">
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
        <PaginationBar />
      </div>
    </div>
  );
}
