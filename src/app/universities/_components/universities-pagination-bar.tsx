"use client";

import { useUniversitiesPage } from "@/app/universities/_components/universities-page-provider";
import PaginationBar from "@/components/navigation/pagination-bar";
import { cn } from "@/components/ui/utils";

type Props = {
  className?: string;
  hideWhenSinglePage?: boolean;
};

export default function UniversitiesPaginationBar({
  hideWhenSinglePage,
  className,
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
  } = useUniversitiesPage();
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
      eventName="Prev/Next University Page Button Clicked"
    />
  );
}
