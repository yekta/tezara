"use client";

import PaginationBar from "@/components/navigation/pagination-bar";
import { cn } from "@/components/ui/utils";

type Props = {
  className?: string;
};

export default function UniversityPaginationBar({ className }: Props) {
  return (
    <PaginationBar
      currentPage={1}
      hasNext={true}
      hasPrev={false}
      firstPage={1}
      goToNextPage={() => {}}
      goToPrevPage={() => {}}
      goToPage={() => {}}
      lastPage={10}
      nextPage={2}
      prevPage={undefined}
      className={cn("border-border border rounded-xl", className)}
      eventName="Prev/Next University Page Button Clicked"
    />
  );
}
