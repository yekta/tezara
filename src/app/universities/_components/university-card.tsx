import { universitiesRoute } from "@/app/universities/_components/constants";
import getUniversityCardId from "@/app/universities/_components/helpers";
import { useSearchParamsClientOnly } from "@/components/providers/search-params-client-only-provider";
import { Button, LinkButton } from "@/components/ui/button";
import { previousPathAtom } from "@/lib/store/main";
import { AppRouterOutputs } from "@/server/trpc/api/root";
import { useSetAtom } from "jotai";

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
            : `${universitiesRoute}/${encodeURIComponent(university.name)}`
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
        <h2
          className="w-full shrink min-w-0 text-left text-balance leading-tight font-bold
          group-data-[placeholder]/item:animate-skeleton group-data-[placeholder]/item:text-transparent
          group-data-[placeholder]/item:bg-foreground group-data-[placeholder]/item:rounded-md"
        >
          <span className="font-icon icon-landmark mr-1 -ml-0.25" />
          {isPlaceholder ? "İstanbul Üniversitesi" : university.name}
        </h2>
        <div className="w-full text-sm gap-2 flex flex-wrap flex-1 content-end justify-start">
          <Stat
            value={
              isPlaceholder
                ? `2000-2024`
                : `${university.year_start}-${university.year_end}`
            }
            label="Tez Yılları"
            classNameIcon="icon-calendar"
            hideLabel
          />
          <Stat
            value={isPlaceholder ? 1000 : university.thesis_count}
            label="Tez"
            classNameIcon="icon-scroll-text"
          />
          <Stat
            value={isPlaceholder ? 8 : university.language_count}
            label="Dil"
            classNameIcon="icon-globe"
          />
          <Stat
            value={isPlaceholder ? 100 : university.subject_count_turkish}
            label="Konu"
            classNameIcon="icon-folder-closed"
          />
          <Stat
            value={isPlaceholder ? 1000 : university.keyword_count_turkish}
            label="Anahtar Kelime"
            classNameIcon="icon-key-round"
          />
        </div>
      </Component>
    </li>
  );
}

function Stat({
  value,
  label,
  classNameIcon,
  hideLabel,
}: {
  value: number | string;
  label: string;
  classNameIcon: string;
  hideLabel?: boolean;
}) {
  return (
    <p
      aria-label={label}
      className="shrink min-w-0 pr-1.5 leading-tight text-muted-foreground font-bold text-left group-data-[placeholder]/item:animate-skeleton 
      group-data-[placeholder]/item:text-transparent group-data-[placeholder]/item:bg-muted-foreground group-data-[placeholder]/item:rounded"
    >
      <span className={`${classNameIcon} font-icon mr-0.75`} />
      {typeof value === "number" ? value.toLocaleString() : value}
      {!hideLabel && <span className="font-medium">{` ${label}`}</span>}
    </p>
  );
}
