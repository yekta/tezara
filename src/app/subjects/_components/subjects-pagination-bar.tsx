"use client";

import { useSubjectsPage } from "@/app/subjects/_components/subjects-page-provider";
import PaginationBar from "@/components/navigation/pagination-bar";
import { cn } from "@/components/ui/utils";

type Props = {
  className?: string;
  hideWhenSinglePage?: boolean;
};

export default function SubjectsPaginationBar({
  className,
  hideWhenSinglePage,
}: Props) {
  const {
    hasNext,
    goToNextPage,
    goToPrevPage,
    goToPage,
    currentPage,
    lastPage,
    nextPage,
    prevPage,
    hasPrev,
    isPending,
    isFetching,
    hasMultiplePages,
  } = useSubjectsPage();
  return hideWhenSinglePage && hasMultiplePages === false ? null : (
    <PaginationBar
      showLoader={isFetching || isPending}
      currentPage={currentPage}
      hasNext={hasNext}
      hasPrev={hasPrev}
      firstPage={1}
      goToNextPage={goToNextPage}
      goToPrevPage={goToPrevPage}
      goToPage={goToPage}
      lastPage={lastPage}
      nextPage={nextPage}
      prevPage={prevPage}
      className={cn("border-border border rounded-xl", className)}
      eventName="Prev/Next Subject Page Button Clicked"
    />
  );
}
