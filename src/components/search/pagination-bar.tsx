import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/components/ui/utils";

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
          <p className="flex-1 px-2 text-sm overflow-hidden leading-tight overflow-ellipsis whitespace-nowrap text-center shrink min-w-0 font-semibold text-muted-foreground">
            Sayfa:{" "}
            <span className="text-foreground font-mono font-bold">
              {currentPage.toLocaleString()}
            </span>
          </p>
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
