"use client";

import { useUniversitiesPage } from "@/app/universities/_components/universities-page-provider";
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
      <p
        data-pending={isPending ? true : undefined}
        className={cn(
          "shrink mr-0.5 min-w-0 bg-foreground/10 rounded-full leading-tight font-semibold text-sm px-2.5 py-0.5 data-[pending]:animate-skeleton data-[pending]:text-transparent data-[pending]:bg-foreground/40",
          className
        )}
      >
        {isPending || !data ? "1600" : data.totalCount.toLocaleString()}
      </p>
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
