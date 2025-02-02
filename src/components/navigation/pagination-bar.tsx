"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/components/ui/utils";
import { useUmami } from "@/lib/hooks/use-umami";
import { LoaderIcon } from "lucide-react";
import { usePostHog } from "posthog-js/react";

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
  eventName: string;
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
  eventName,
}: Props) {
  const umami = useUmami();
  const posthog = usePostHog();
  const sendEvent = (to: number | undefined) => {
    umami.capture(eventName, {
      "From Page": currentPage,
      "To Page": to || "Undefined",
    });
    posthog.capture(eventName, {
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
            variant="first"
            disabled={!hasPrev}
            isButton
            onClick={() => {
              goToPage(firstPage);
              sendEvent(firstPage);
            }}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious
            disabled={!hasPrev}
            isButton
            onClick={() => {
              goToPrevPage();
              sendEvent(prevPage);
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
            isButton
            disabled={!hasNext}
            onClick={() => {
              goToNextPage();
              sendEvent(nextPage);
            }}
          />
        </PaginationItem>
        <PaginationItem className="-mr-1">
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
      </PaginationContent>
    </Pagination>
  );
}
