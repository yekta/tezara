"use client";

import { useUniversitiesPageParam } from "@/app/universities/_components/query-param-provider";
import { useUniversitiesPage } from "@/app/universities/_components/universities-page-provider";
import UniversityCard from "@/app/universities/_components/university-card";
import { SearchIcon } from "@/components/icons/search-icon";
import KgkSponsorCard from "@/components/promo/kgk-sponsor-card";
import { TriangleAlertIcon } from "lucide-react";

export default function UniversitiesCardsGrid() {
  const { data, isPending, isError } = useUniversitiesPage();
  const universities = data?.result;
  const isHardError = !isPending && isError;
  const [query] = useUniversitiesPageParam.q();

  return isHardError ? (
    <li className="w-full py-12 flex-1 flex flex-col items-center justify-center text-destructive text-sm">
      <TriangleAlertIcon className="size-7" />
      <p className="w-full text-balance text-center mt-1.5 font-semibold leading-tight">
        Birşeyler ters gitti
      </p>
    </li>
  ) : !isHardError &&
    universities &&
    universities.length === 0 &&
    !isPending ? (
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
      {!isHardError && universities
        ? universities.length > 0 && (
            <>
              {!query && <KgkSponsorCard />}
              {universities.map((university, index) => (
                <UniversityCard
                  key={`${university.name}-${index}`}
                  university={university}
                />
              ))}
            </>
          )
        : !isHardError &&
          !universities &&
          isPending &&
          Array.from({ length: 30 }).map((_, i) => (
            <UniversityCard key={i} isPlaceholder />
          ))}
    </ol>
  );
}
