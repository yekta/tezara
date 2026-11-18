"use client";

import SubjectCard from "@/app/subjects/_components/subject-card";
import { useSubjectsPage } from "@/app/subjects/_components/subjects-page-provider";
import { SearchIcon } from "@/components/icons/search-icon";
import { TriangleAlertIcon } from "lucide-react";

export default function SubjectsCardsGrid() {
  const { data, isPending, isError } = useSubjectsPage();
  const subjects = data?.result;
  const isHardError = !isPending && isError;

  return isHardError ? (
    <li className="w-full py-12 flex-1 flex flex-col items-center justify-center text-destructive text-sm">
      <TriangleAlertIcon className="size-7" />
      <p className="w-full text-balance text-center mt-1.5 font-semibold leading-tight">
        Birşeyler ters gitti
      </p>
    </li>
  ) : !isHardError && subjects && subjects.length === 0 && !isPending ? (
    <li className="w-full py-12 flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm">
      <SearchIcon className="size-7" />
      <p className="w-full text-balance text-center mt-1.5 font-semibold leading-tight">
        Eşleşen yok
      </p>
    </li>
  ) : (
    <ol
      data-pending={isPending ? true : undefined}
      data-error={isHardError ? true : undefined}
      className="w-full flex flex-wrap content-start justify-start flex-1 px-1 py-1"
    >
      {!isHardError && subjects
        ? subjects.map((subject, index) => (
            <SubjectCard key={`${subject.name}-${index}`} subject={subject} />
          ))
        : !isHardError &&
          !subjects &&
          isPending &&
          Array.from({ length: 30 }).map((_, i) => (
            <SubjectCard key={i} isPlaceholder />
          ))}
    </ol>
  );
}
