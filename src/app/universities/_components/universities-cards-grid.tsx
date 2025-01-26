"use client";

import { useUniversitiesPage } from "@/app/universities/_components/universities-page-provider";
import { universitiesRoute } from "@/app/universities/constants/main";
import CalendarIcon from "@/components/icons/calendar";
import FolderClosedIcon from "@/components/icons/folder-closed";
import GlobeIcon from "@/components/icons/globe";
import KeyRoundIcon from "@/components/icons/key-round";
import LandmarkIcon from "@/components/icons/landmark";
import ScrollTextIcon from "@/components/icons/scroll-text-icon";
import { SearchIcon } from "@/components/icons/search-icon";
import { Button, LinkButton } from "@/components/ui/button";
import { previousPathForUniversitiesPageAtom } from "@/lib/store/main";
import { AppRouterOutputs } from "@/server/trpc/api/root";
import { useSetAtom } from "jotai";
import { TriangleAlertIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FC } from "react";

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

function UniversityCard({
  university,
  isPlaceholder,
}:
  | {
      university: AppRouterOutputs["main"]["getUniversities"]["result"][0];
      isPlaceholder?: false;
    }
  | { university?: null; isPlaceholder: true }) {
  const Component = isPlaceholder ? Button : LinkButton;

  const searchParams = useSearchParams();
  const searchParamsStr = searchParams.toString();
  const setPreviousPathForUniversityPage = useSetAtom(
    previousPathForUniversitiesPageAtom
  );

  return (
    <li
      id={university ? university.name : undefined}
      data-placeholder={isPlaceholder ? true : undefined}
      className="w-full flex items-start justify-start md:w-1/2 lg:w-1/3 p-1 group/item"
    >
      <Component
        href={
          isPlaceholder
            ? universitiesRoute
            : `/university/${encodeURIComponent(university.name)}`
        }
        onClick={() => {
          if (!isPlaceholder) {
            setPreviousPathForUniversityPage(
              `${universitiesRoute}${
                searchParamsStr ? `?${searchParamsStr}` : ""
              }${"#" + university.name}`
            );
          }
        }}
        disabled={isPlaceholder}
        variant="outline"
        fadeOnDisabled={false}
        className="w-full min-h-48 active:bg-background-hover not-touch:hover:bg-background-hover flex flex-col gap-6 rounded-xl px-4 pt-3.5 pb-4 items-start justify-start"
      >
        <div className="w-full flex-1 flex items-start justify-start gap-1.5">
          <LandmarkIcon
            className="size-4 inline shrink-0 -ml-0.5 mt-0.5 group-data-[placeholder]/item:animate-skeleton group-data-[placeholder]/item:text-transparent
            group-data-[placeholder]/item:bg-foreground group-data-[placeholder]/item:rounded-md"
          />
          <div className="shrink min-w-0 gap-0.5 flex flex-col items-start">
            <h3
              className="shrink min-w-0 text-left text-balance leading-tight font-bold
              group-data-[placeholder]/item:animate-skeleton group-data-[placeholder]/item:text-transparent
              group-data-[placeholder]/item:bg-foreground group-data-[placeholder]/item:rounded-md"
            >
              {isPlaceholder ? "İstanbul Üniversitesi" : university.name}
            </h3>
          </div>
        </div>
        <div className="w-full text-sm gap-2 flex flex-wrap">
          <Stat
            value={
              isPlaceholder
                ? `2000-2024`
                : `${university.year_start}-${university.year_end}`
            }
            label="Tez Yılları"
            hideLabel
            Icon={CalendarIcon}
          />
          <Stat
            value={isPlaceholder ? 1000 : university.thesis_count}
            label="Tez"
            Icon={ScrollTextIcon}
          />
          <Stat
            value={isPlaceholder ? 8 : university.language_count}
            label="Dil"
            Icon={GlobeIcon}
          />
          <Stat
            value={isPlaceholder ? 100 : university.turkish_subject_count}
            label="Konu"
            Icon={FolderClosedIcon}
          />
          <Stat
            value={isPlaceholder ? 1000 : university.turkish_keyword_count}
            label="Anahtar Kelime"
            Icon={KeyRoundIcon}
          />
        </div>
      </Component>
    </li>
  );
}

function Stat({
  value,
  label,
  Icon,
  hideLabel,
}: {
  value: number | string;
  label: string;
  Icon: FC<{ className?: string }>;
  hideLabel?: boolean;
}) {
  return (
    <div className="flex shrink min-w-0 items-center gap-1 leading-tight pr-2 text-muted-foreground">
      <Icon
        className="inline size-3.5 shrink-0 group-data-[placeholder]/item:animate-skeleton group-data-[placeholder]/item:text-transparent
        group-data-[placeholder]/item:bg-muted-foreground group-data-[placeholder]/item:rounded"
      />
      <p
        className="font-bold shrink min-w-0 text-left group-data-[placeholder]/item:animate-skeleton group-data-[placeholder]/item:text-transparent
        group-data-[placeholder]/item:bg-muted-foreground group-data-[placeholder]/item:rounded"
      >
        {typeof value === "number" ? value.toLocaleString() : value}
        {!hideLabel && <span className="font-medium"> {label}</span>}
      </p>
    </div>
  );
}
