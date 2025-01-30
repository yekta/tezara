"use client";

import { useUniversitiesPage } from "@/app/universities/_components/universities-page-provider";
import Chip from "@/components/chip";
import { cn } from "@/components/ui/utils";
import { LoaderIcon, TriangleAlertIcon } from "lucide-react";

export default function UniversitiesCountChip({
  className,
}: {
  className?: string;
}) {
  const { data, isPending, isError, isFetching } = useUniversitiesPage();

  const isHardError = isError && !isPending;
  return isHardError ? (
    <TriangleAlertIcon className={cn("size-5 text-destructive", className)} />
  ) : (
    <>
      <Chip
        className="mr-0.5 my-0.5"
        data-pending={isPending ? true : undefined}
      >
        {isPending || !data ? "1600" : data.totalCount.toLocaleString()}
      </Chip>
      {isFetching && (
        <LoaderIcon
          className={cn(
            "size-5 shrink-0 animate-spin text-muted-foreground",
            className
          )}
        />
      )}
    </>
  );
}
