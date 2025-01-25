"use client";

import FileExtensionIcon from "@/components/icons/sets/file-extension";
import { capture } from "@/components/providers/ph-provider";
import { formatForDownload } from "@/components/search/format-for-download";
import PaginationBar from "@/components/search/pagination-bar";
import { useSearchResults } from "@/components/search/results/search-results-provider";
import ResultsSection from "@/components/search/results/thesis-search-result-row-list";
import { Button } from "@/components/ui/button";
import { Parser } from "@json2csv/plainjs";
import {
  CheckCircleIcon,
  LoaderIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useUmami } from "next-umami";
import { useState } from "react";

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
    isFetching,
    isError,
    currentPage,
    hasNext,
    hasPrev,
    goToNextPage,
    goToPrevPage,
    goToPage,
    firstPage,
    lastPage,
    prevPage,
    nextPage,
  } = searchResultsContext;

  const isHardError = !data && !isPending && isError;
  const isJustFetching = !isPending && isFetching;

  const umami = useUmami();

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
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

      setIsPendingDownload(false);
      umami.event("Downloaded Bulk CSV", {
        "Row Count": res.hits.length,
        "Size (MB)": Number((blob.size / 1024 / 1024).toPrecision(6)),
      });
      capture("Downloaded Bulk CSV", {
        "Row Count": res.hits.length,
        "Size (MB)": Number((blob.size / 1024 / 1024).toPrecision(6)),
      });

      const name = `search-results-${Date.now()}.csv`;
      downloadAndClean(name, blob);
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
      const blob = new Blob([JSON.stringify(formatted, null, 2)], {
        type: "application/json",
      });

      setIsPendingJsonDownload(false);
      umami.event("Downloaded Bulk JSON", {
        "Row Count": res.hits.length,
        "Size (MB)": Number((blob.size / 1024 / 1024).toPrecision(6)),
      });
      capture("Downloaded Bulk JSON", {
        "Row Count": res.hits.length,
        "Size (MB)": Number((blob.size / 1024 / 1024).toPrecision(6)),
      });

      const name = `search-results-${Date.now()}.json`;
      downloadAndClean(name, blob);
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

  const metricsPendingClassName =
    "group-data-[pending]:text-transparent group-data-[pending]:animate-skeleton group-data-[pending]:bg-foreground group-data-[pending]:rounded-sm";

  return (
    <div
      data-pending={isPending ? true : undefined}
      className="w-full flex-1 flex flex-col pt-6 group"
    >
      <div className="w-full flex flex-wrap items-start gap-1.5">
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
            !data && isError
              ? true
              : !data
              ? false
              : isPendingCsvDownload
              ? false
              : true
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
            !data && isError
              ? true
              : !data
              ? false
              : isPendingJsonDownload
              ? false
              : true
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
      {/* Metrics */}
      <div className="w-full flex items-center justify-start py-3.5 px-1.5 gap-1.5">
        <p className="shrink min-w-0 font-semibold text-sm text-muted-foreground text-balance">
          <span>Eşleşen: </span>
          {!data ? (
            <span className={metricsPendingClassName}>
              {isHardError ? "0" : "900,000"}
            </span>
          ) : (
            <span className="text-foreground">
              {data.hits.length > 0 ? data.totalHits.toLocaleString() : 0}
            </span>
          )}
          <span className="text-foreground/30 px-[0.75ch]">|</span>
          <span>Gösterilen: </span>
          {!data ? (
            <span className={metricsPendingClassName}>
              {isHardError ? 0 : 10}
            </span>
          ) : (
            <span className="text-foreground">
              {data.hits.length.toLocaleString()}
            </span>
          )}
          <span className="text-foreground/30 px-[0.75ch]">|</span>
          {!data ? (
            <span
              className={
                isHardError ? "text-destructive" : metricsPendingClassName
              }
            >
              {isHardError ? "Hata" : "0.001 sn."}
            </span>
          ) : (
            <span className="text-foreground">
              {(data.processingTimeMs / 1000).toLocaleString()} sn.
            </span>
          )}
        </p>
        {isJustFetching ? (
          <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="size-4">
            {!isPending && !isFetching && !isError && data && (
              <CheckCircleIcon className="text-success size-full" />
            )}
          </div>
        )}
      </div>
      <div className="w-full flex flex-col flex-1">
        <PaginationBar
          hasNext={hasNext}
          hasPrev={hasPrev}
          prevPage={prevPage}
          nextPage={nextPage}
          goToPage={goToPage}
          goToNextPage={goToNextPage}
          goToPrevPage={goToPrevPage}
          currentPage={currentPage}
          firstPage={firstPage}
          lastPage={lastPage}
          showLoader={isJustFetching}
        />
        {isHardError && (
          <div className="w-full py-12 flex-1 flex flex-col items-center justify-center text-destructive text-sm">
            <TriangleAlertIcon className="size-7" />
            <p className="w-full text-balance text-center mt-1.5 font-semibold leading-tight">
              Birşeyler ters gitti
            </p>
          </div>
        )}
        {data && data.hits && data.hits.length === 0 && (
          <div className="w-full py-12 flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm">
            <SearchIcon className="size-7" />
            <p className="w-full text-balance text-center mt-1.5 font-semibold leading-tight">
              Eşleşen yok
            </p>
          </div>
        )}
        {/* Result rows */}
        {((!data && isPending) ||
          (data && data.hits && data.hits.length > 0)) && (
          <ResultsSection data={data} />
        )}
        <PaginationBar
          hasNext={hasNext}
          hasPrev={hasPrev}
          prevPage={prevPage}
          nextPage={nextPage}
          goToPage={goToPage}
          goToNextPage={goToNextPage}
          goToPrevPage={goToPrevPage}
          currentPage={currentPage}
          firstPage={firstPage}
          lastPage={lastPage}
          showLoader={isJustFetching}
        />
      </div>
    </div>
  );
}
