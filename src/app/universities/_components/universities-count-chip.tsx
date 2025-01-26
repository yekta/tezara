"use client";

import { useUniversitiesPage } from "@/app/universities/_components/universities-page-provider";
import { LoaderIcon, TriangleAlertIcon } from "lucide-react";

export default function UniversitiesCountChip() {
  const { data, isPending, isError, isFetching } = useUniversitiesPage();

  const isHardError = isError && !isPending;
  return isHardError ? (
    <TriangleAlertIcon className="size-5 text-destructive" />
  ) : (
    <>
      <p
        data-pending={isPending ? true : undefined}
        className="shrink mr-0.5 min-w-0 bg-foreground/10 rounded-full leading-tight font-semibold text-sm px-2.5 py-0.75
        data-[pending]:animate-skeleton data-[pending]:text-transparent data-[pending]:bg-foreground/40"
      >
        {isPending || !data ? "1600" : data.totalCount.toLocaleString()}
      </p>
      {isFetching && (
        <LoaderIcon className="size-5 shrink-0 animate-spin text-muted-foreground" />
      )}
    </>
  );
}
