"use client";

import ThesisRow from "@/components/search/results/thesis-row";
import { cn } from "@/components/ui/utils";
import { TSearchThesesResult } from "@/server/meili/repo/thesis";
import { usePathname } from "next/navigation";

type Props = {
  className?: string;
  classNameRow?: string;
  disableUniversityLink?: boolean;
  disableSubjectLink?: boolean;
  data: TSearchThesesResult | undefined;
};

export default function ThesisRowList({
  data,
  disableUniversityLink,
  disableSubjectLink,
  className,
  classNameRow,
}: Props) {
  const pathname = usePathname();
  return (
    <ol className={cn("w-full flex-1 flex flex-col", className)}>
      {data
        ? data.hits.map((i, index) => (
            <ThesisRow
              className={classNameRow}
              pagePathname={pathname}
              disableUniversityLink={disableUniversityLink}
              disableSubjectLink={disableSubjectLink}
              key={`${i.id}-${index}`}
              thesis={i}
            />
          ))
        : Array.from({ length: 20 }).map((i, index) => (
            <ThesisRow
              className={classNameRow}
              pagePathname={pathname}
              disableUniversityLink={disableUniversityLink}
              disableSubjectLink={disableSubjectLink}
              key={index}
              isPlaceholder
            />
          ))}
    </ol>
  );
}
