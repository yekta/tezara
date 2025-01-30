import { subjectsRoute } from "@/app/subjects/_components/constants";
import getSubjectCardId from "@/app/subjects/_components/helpers";
import { useSearchParamsClientOnly } from "@/components/providers/search-params-client-only-provider";
import { Button, LinkButton } from "@/components/ui/button";
import { previousPathAtom } from "@/lib/store/main";
import { AppRouterOutputs } from "@/server/trpc/api/root";
import { useSetAtom } from "jotai";

type TSubjectCardProps =
  | {
      subject: AppRouterOutputs["main"]["getSubjects"]["result"][0];
      isPlaceholder?: false;
    }
  | {
      subject?: null;
      isPlaceholder: true;
    };

export default function SubjectCard({
  subject,
  isPlaceholder,
}: TSubjectCardProps) {
  const Component = isPlaceholder ? Button : LinkButton;

  const [, searchParamsStr] = useSearchParamsClientOnly();
  const setPreviousPath = useSetAtom(previousPathAtom);
  const hash = subject ? `#${getSubjectCardId(subject)}` : "";

  return (
    <li
      id={subject ? getSubjectCardId(subject) : undefined}
      data-placeholder={isPlaceholder ? true : undefined}
      className="w-full flex items-start justify-start md:w-1/2 lg:w-1/3 p-1 group/item"
    >
      <Component
        href={
          isPlaceholder
            ? subjectsRoute
            : `${subjectsRoute}/${encodeURIComponent(subject.name)}`
        }
        onClick={() => {
          if (!isPlaceholder) {
            setPreviousPath(`${subjectsRoute}${searchParamsStr}${hash}`);
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
          <span className="font-icon icon-folder-closed mr-1.5 -ml-0.25" />
          {isPlaceholder ? "İstanbul Üniversitesi" : subject.name}
        </h2>
        <div className="w-full text-sm gap-2 flex flex-wrap flex-1 content-end justify-start">
          <Stat
            value={isPlaceholder ? 1000 : subject.thesis_count}
            label="Tez"
            classNameIcon="icon-scroll-text"
          />
          <Stat
            value={isPlaceholder ? 100 : subject.university_count}
            label="Üniversite"
            classNameIcon="icon-landmark"
          />
          <Stat
            value={isPlaceholder ? 8 : subject.language_count}
            label="Dil"
            classNameIcon="icon-globe"
          />
          <Stat
            value={
              isPlaceholder
                ? `2000-2024`
                : `${subject.year_start}-${subject.year_end}`
            }
            label="Tez Yılları"
            classNameIcon="icon-calendar"
            hideLabel
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
