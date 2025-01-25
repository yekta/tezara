"use client";

import { capture } from "@/components/providers/ph-provider";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/components/ui/utils";
import { LoaderIcon } from "lucide-react";
import { useUmami } from "next-umami";

type Props = {
  className?: string;
  hasPrev: boolean;
  hasNext: boolean;
  prevPage: number | undefined;
  nextPage: number | undefined;
  currentPage: number;
  firstPage: number;
  lastPage: number;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  goToPage: (page: number) => void;
  showLoader?: boolean;
};

export default function PaginationBar({
  className,
  hasPrev,
  hasNext,
  prevPage,
  nextPage,
  currentPage,
  firstPage,
  lastPage,
  goToNextPage,
  goToPrevPage,
  goToPage,
  showLoader,
}: Props) {
  const umami = useUmami();
  const sendEvent = (to: number | undefined) => {
    umami.event("Prev/Next Search Result Page Button Clicked", {
      "From Page": currentPage,
      "To Page": to || "Undefined",
    });
    capture("Prev/Next Search Result Page Button Clicked", {
      "From Page": currentPage,
      "To Page": to || "Undefined",
    });
  };

  return (
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
            onClick={() => {
              goToPrevPage();
              sendEvent(prevPage);
            }}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious
            variant="first"
            disabled={!hasPrev}
            isButton
            onClick={() => {
              goToPage(firstPage);
              sendEvent(firstPage);
            }}
          />
        </PaginationItem>
        <li className="flex-1 flex items-center justify-center min-w-0">
          <div className="flex-1 flex items-center justify-center min-w-0 px-2 gap-1.5">
            <div className="size-4 -my-1 text-muted-foreground shrink-0" />
            <p className="text-sm overflow-hidden leading-tight overflow-ellipsis whitespace-nowrap text-center shrink min-w-0 font-semibold text-muted-foreground">
              Sayfa:{" "}
              <span className="text-foreground font-mono font-bold">
                {currentPage.toLocaleString()}
              </span>
            </p>
            {showLoader ? (
              <LoaderIcon className="size-4 -my-1 text-muted-foreground shrink-0 animate-spin" />
            ) : (
              <div className="size-4 -my-1 text-muted-foreground shrink-0" />
            )}
          </div>
        </li>
        <PaginationItem>
          <PaginationNext
            variant="last"
            isButton
            disabled={!hasNext}
            onClick={() => {
              goToPage(lastPage);
              sendEvent(lastPage);
            }}
          />
        </PaginationItem>
        <PaginationItem className="-mr-1">
          <PaginationNext
            isButton
            disabled={!hasNext}
            onClick={() => {
              goToNextPage();
              sendEvent(nextPage);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
