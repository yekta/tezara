import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/components/ui/utils";
import { LoaderIcon } from "lucide-react";

type Props = {
  className?: string;
  hasPrev: boolean;
  hasNext: boolean;
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
  currentPage,
  firstPage,
  lastPage,
  goToNextPage,
  goToPrevPage,
  goToPage,
  showLoader,
}: Props) {
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
            onClick={() => goToPage(lastPage)}
          />
        </PaginationItem>
        <PaginationItem className="-mr-1">
          <PaginationNext isButton disabled={!hasNext} onClick={goToNextPage} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
