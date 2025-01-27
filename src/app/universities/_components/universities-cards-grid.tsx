"use client";

import { useUniversitiesPage } from "@/app/universities/_components/universities-page-provider";
import UniversityCard from "@/app/universities/_components/university-card";
import { SearchIcon } from "@/components/icons/search-icon";
import { TriangleAlertIcon } from "lucide-react";

export default function UniversitiesCardsGrid() {
  const { data, isPending, isError } = useUniversitiesPage();
  const universities = data?.result;
  const isHardError = !isPending && isError;

  return (
    <ol
      data-pending={isPending ? true : undefined}
      data-error={isHardError ? true : undefined}
      className="w-full flex flex-wrap flex-1 px-1 py-1"
    >
      {isHardError && (
        <div className="w-full py-12 flex-1 flex flex-col items-center justify-center text-destructive text-sm">
          <TriangleAlertIcon className="size-7" />
          <p className="w-full text-balance text-center mt-1.5 font-semibold leading-tight">
            Birşeyler ters gitti
          </p>
        </div>
      )}
      {!isHardError &&
        universities &&
        universities.length === 0 &&
        !isPending && (
          <div className="w-full py-12 flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm">
            <SearchIcon className="size-7" />
            <p className="w-full text-balance text-center mt-1.5 font-semibold leading-tight">
              Eşleşen yok
            </p>
          </div>
        )}
      {!isHardError && universities
        ? universities.map((university, index) => (
            <UniversityCard
              key={`${university.name}-${index}`}
              university={university}
            />
          ))
        : !isHardError &&
          !universities &&
          isPending &&
          Array.from({ length: 30 }).map((_, i) => (
            <UniversityCard key={i} isPlaceholder />
          ))}
    </ol>
  );
}
