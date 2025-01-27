import { universitiesRoute } from "@/app/universities/constants/main";
import getUniversityCardId from "@/app/universities/helpers";
import CalendarIcon from "@/components/icons/calendar";
import FolderClosedIcon from "@/components/icons/folder-closed";
import GlobeIcon from "@/components/icons/globe";
import KeyRoundIcon from "@/components/icons/key-round";
import LandmarkIcon from "@/components/icons/landmark";
import ScrollTextIcon from "@/components/icons/scroll-text-icon";
import { useSearchParamsClientOnly } from "@/components/providers/search-params-client-only-provider";
import { Button, LinkButton } from "@/components/ui/button";
import { previousPathAtom } from "@/lib/store/main";
import { AppRouterOutputs } from "@/server/trpc/api/root";
import { useSetAtom } from "jotai";
import { FC } from "react";

type TUniversityCardProps =
  | {
      university: AppRouterOutputs["main"]["getUniversities"]["result"][0];
      isPlaceholder?: false;
    }
  | {
      university?: null;
      isPlaceholder: true;
    };

export default function UniversityCard({
  university,
  isPlaceholder,
}: TUniversityCardProps) {
  const Component = isPlaceholder ? Button : LinkButton;

  const [, searchParamsStr] = useSearchParamsClientOnly();
  const setPreviousPath = useSetAtom(previousPathAtom);
  const hash = university ? `#${getUniversityCardId(university)}` : "";

  return (
    <li
      id={university ? getUniversityCardId(university) : undefined}
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
            setPreviousPath(`${universitiesRoute}${searchParamsStr}${hash}`);
          }
        }}
        disabled={isPlaceholder}
        variant="outline"
        fadeOnDisabled={false}
        className="w-full min-h-48 active:bg-background-hover not-touch:hover:bg-background-hover flex flex-col gap-6 rounded-xl px-4 pt-3.5 pb-4 items-start justify-start"
      >
        <div className="w-full flex-1 flex items-start justify-start gap-1.5">
          <LandmarkIcon
            className="size-4 inline shrink-0 -ml-0.25 mt-0.5 group-data-[placeholder]/item:animate-skeleton group-data-[placeholder]/item:text-transparent
            group-data-[placeholder]/item:bg-foreground group-data-[placeholder]/item:rounded-md"
          />
          <h2
            className="shrink min-w-0 text-left text-balance leading-tight font-bold
              group-data-[placeholder]/item:animate-skeleton group-data-[placeholder]/item:text-transparent
              group-data-[placeholder]/item:bg-foreground group-data-[placeholder]/item:rounded-md"
          >
            {isPlaceholder ? "İstanbul Üniversitesi" : university.name}
          </h2>
        </div>
        <div className="w-full text-sm gap-2 flex flex-wrap">
          <Stat
            value={
              isPlaceholder
                ? `2000-2024`
                : `${university.year_start}-${university.year_end}`
            }
            label="Tez Yılları"
            Icon={CalendarIcon}
            hideLabel
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
            value={isPlaceholder ? 100 : university.subject_count_turkish}
            label="Konu"
            Icon={FolderClosedIcon}
          />
          <Stat
            value={isPlaceholder ? 1000 : university.keyword_count_turkish}
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
    <div
      aria-label={label}
      className="flex shrink pr-1.5 min-w-0 items-center gap-0.75 leading-tight text-muted-foreground"
    >
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
