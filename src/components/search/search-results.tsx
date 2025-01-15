"use client";

import FileExtensionIcon from "@/components/icons/file-extension";
import { useSearchResults } from "@/components/search/search-results-provider";
import { Button, LinkButton } from "@/components/ui/button";
import { LoaderIcon, SearchIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { Parser } from "@json2csv/plainjs";

type Props = {
  className?: string;
};

const TURKISH = "Türkçe";
const emptyFieldText = "Yok";

export default function SearchResults({}: Props) {
  const { data, isPending, isLoadingError, bulkDownload } = useSearchResults();
  const [isPendingCsvDownload, setIsPendingDownload] = useState(false);
  const [isPendingJsonDownload, setIsPendingJsonDownload] = useState(false);
  const isPendingDownload = isPendingCsvDownload || isPendingJsonDownload;

  function formatter(data: Awaited<ReturnType<typeof bulkDownload>>) {
    const formattedData: Record<string, string | number>[] = [];
    for (let i = 0; i < data.length; i++) {
      const result = data[i];
      formattedData.push({
        "Tez No": result.id,
        "Başlık (Orijinal)":
          result.languageName === TURKISH
            ? result.titleTurkish || emptyFieldText
            : result.titleForeign || emptyFieldText,
        "Başlık (Çeviri)":
          result.languageName === TURKISH
            ? result.titleForeign || emptyFieldText
            : result.titleTurkish || emptyFieldText,
        "Özet (Orijinal)":
          result.languageName === TURKISH
            ? result.abstractTurkish || emptyFieldText
            : result.abstractForeign || emptyFieldText,
        "Özet (Çeviri)":
          result.languageName === TURKISH
            ? result.abstractForeign || emptyFieldText
            : result.abstractTurkish || emptyFieldText,
        Yazar: result.authorName || emptyFieldText,
        Üniversite: result.universityName || emptyFieldText,
        Enstitü: result.instituteName || emptyFieldText,
        "Ana Bilim Dalı": result.departmentName || emptyFieldText,
        "Bilim Dalı": result.branchName || emptyFieldText,
        "Tez Türü": result.thesisTypeName || emptyFieldText,
        Danışmanlar:
          result.advisors.length > 0
            ? result.advisors.map((advisor) => advisor.name).join(", ")
            : emptyFieldText,
        Yıl: result.year || emptyFieldText,
        "Safya Sayısı": result.pageCount || emptyFieldText,
        Dil: result.languageName || emptyFieldText,
        "PDF Linki": result.pdfUrl || emptyFieldText,
      });
    }
    return formattedData;
  }

  async function downloadCsv() {
    setIsPendingDownload(true);
    try {
      const res = await bulkDownload();
      const formatted = formatter(res);
      const parser = new Parser();
      const csv = parser.parse(formatted);

      // Convert CSV to a Blob
      const csvBlob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

      setIsPendingDownload(false);

      // Create a temporary anchor element
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(csvBlob);
      downloadLink.download = `search-results-${Date.now()}.csv`;

      // Trigger the download
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Clean up
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);
    } catch (error) {
      console.log(error);
      setIsPendingDownload(false);
    }
  }

  async function downloadJson() {
    setIsPendingJsonDownload(true);
    try {
      const res = await bulkDownload();
      const formatted = formatter(res);
      // Convert the formatted JSON to a Blob
      const jsonBlob = new Blob([JSON.stringify(formatted, null, 2)], {
        type: "application/json",
      });

      setIsPendingJsonDownload(false);

      // Create a temporary anchor element
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(jsonBlob);
      downloadLink.download = `search-results-${Date.now()}.json`; // File name

      // Trigger the download
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Clean up
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);
    } catch (error) {
      console.log(error);
      setIsPendingJsonDownload(false);
    }
  }

  return (
    <div className="w-full flex flex-col">
      {data && data.length > 0 && (
        <div className="w-full flex flex-wrap items-start mt-6 gap-1.5">
          <Button
            onClick={() => downloadCsv()}
            disabled={isPendingCsvDownload || isPendingDownload}
            size="sm"
            variant="success"
            fadeOnDisabled={isPendingCsvDownload ? false : true}
            className={
              isPendingCsvDownload ? "bg-success/75 overflow-hidden" : ""
            }
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
              {isPendingCsvDownload ? "İndiriliyor" : "Tablo Olarak İndir"}
            </p>
          </Button>
          <Button
            onClick={() => downloadJson()}
            disabled={isPendingJsonDownload || isPendingDownload}
            size="sm"
            fadeOnDisabled={isPendingJsonDownload ? false : true}
            className={
              isPendingJsonDownload ? "bg-primary/75 overflow-hidden" : ""
            }
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
              {isPendingJsonDownload ? "İndiriliyor" : "JSON Olarak İndir"}
            </p>
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
