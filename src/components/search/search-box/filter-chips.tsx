import BuildingIcon from "@/components/icons/building";
import FolderClosedIcon from "@/components/icons/folder-closed";
import GlobeIcon from "@/components/icons/globe";
import LandmarkIcon from "@/components/icons/landmark";
import PenToolIcon from "@/components/icons/pen-tool";
import ScrollTextIcon from "@/components/icons/scroll-text-icon";
import UserPenIcon from "@/components/icons/user-pen";
import { TSearchLikePageParamKeys } from "@/components/search/constants";
import {
  GetValueType,
  useSearchLikePageParam,
} from "@/components/search/query-param-provider";
import { searchOnOptionsMap } from "@/components/search/search-box/filters/search-on";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import {
  CalendarArrowDownIcon,
  CalendarArrowUpIcon,
  SearchCheckIcon,
  XIcon,
} from "lucide-react";
import { FC, useMemo } from "react";

type Props = {
  className?: string;
};

export default function FilterChips({ className }: Props) {
  const [searchOn, setSearchOn] = useSearchLikePageParam.search_on();
  const [subjects, setSubjects] = useSearchLikePageParam.subjects();
  const [yearGte, setYearsGte] = useSearchLikePageParam.year_gte();
  const [yearLte, setYearLte] = useSearchLikePageParam.year_lte();
  const [universities, setUniversities] = useSearchLikePageParam.universities();
  const [departments, setDepartments] = useSearchLikePageParam.departments();
  const [thesisTypes, setThesisTypes] = useSearchLikePageParam.thesis_types();
  const [languages, setLanguages] = useSearchLikePageParam.languages();
  const [advisors, setAdvisors] = useSearchLikePageParam.advisors();
  const [authors, setAuthors] = useSearchLikePageParam.authors();

  const totalSelectedFilters = useMemo(() => {
    let total = 0;
    if (languages) total += languages.length;
    if (universities) total += universities.length;
    if (departments) total += departments.length;
    if (advisors) total += advisors.length;
    if (authors) total += authors.length;
    if (thesisTypes) total += thesisTypes.length;
    if (yearLte !== null && yearLte !== undefined) total += 1;
    if (yearGte !== null && yearGte !== undefined) total += 1;
    if (searchOn) total += searchOn.length;
    if (subjects) total += subjects.length;
    return total;
  }, [
    languages,
    universities,
    departments,
    advisors,
    authors,
    thesisTypes,
    yearGte,
    yearLte,
    searchOn,
    subjects,
  ]);

  return (
    totalSelectedFilters > 0 && (
      <div
        className={cn(
          "w-full max-w-3xl flex flex-wrap items-center justify-center -my-0.5",
          className
        )}
      >
        <Chips
          value={searchOn}
          valueLabelMap={searchOnOptionsMap}
          onClick={(v) => setSearchOn((prev) => prev.filter((i) => i !== v))}
          Icon={SearchCheckIcon}
        />
        <Chips
          value={subjects}
          onClick={(v) => setSubjects((prev) => prev.filter((i) => i !== v))}
          Icon={FolderClosedIcon}
        />
        <Chips
          value={yearGte}
          onClick={() => setYearsGte(null)}
          Icon={CalendarArrowUpIcon}
        />
        <Chips
          value={yearLte}
          onClick={() => setYearLte(null)}
          Icon={CalendarArrowDownIcon}
        />
        <Chips
          value={universities}
          onClick={(v) =>
            setUniversities((prev) => prev.filter((i) => i !== v))
          }
          Icon={LandmarkIcon}
        />
        <Chips
          value={departments}
          onClick={(v) => setDepartments((prev) => prev.filter((i) => i !== v))}
          Icon={BuildingIcon}
        />
        <Chips
          value={thesisTypes}
          onClick={(v) => setThesisTypes((prev) => prev.filter((i) => i !== v))}
          Icon={ScrollTextIcon}
        />
        <Chips
          value={languages}
          onClick={(v) => setLanguages((prev) => prev.filter((i) => i !== v))}
          Icon={GlobeIcon}
        />
        <Chips
          value={authors}
          onClick={(v) => setAuthors((prev) => prev.filter((i) => i !== v))}
          Icon={PenToolIcon}
        />
        <Chips
          value={advisors}
          onClick={(v) => setAdvisors((prev) => prev.filter((i) => i !== v))}
          Icon={UserPenIcon}
        />
      </div>
    )
  );
}

function Chips<T extends TSearchLikePageParamKeys>({
  value,
  valueLabelMap,
  onClick,
  Icon,
}: {
  value: GetValueType<T>;
  valueLabelMap?: Record<string, string>;
  onClick: (v: string | string[] | number) => void;
  Icon: FC<{ className?: string }>;
}) {
  if (Array.isArray(value)) {
    return value.map((v) => (
      <Chip key={v} Icon={Icon} onClick={() => onClick(v)}>
        {valueLabelMap?.[v] || v}
      </Chip>
    ));
  } else if (typeof value === "string") {
    return (
      <Chip Icon={Icon} onClick={() => onClick(value)}>
        {value}
      </Chip>
    );
  } else if (typeof value === "number") {
    return (
      <Chip Icon={Icon} onClick={() => onClick(value)}>
        {value.toString()}
      </Chip>
    );
  }
}

function Chip({
  Icon,
  children,
  onClick,
}: {
  Icon: FC<{ className?: string }>;
  children: string;
  onClick: () => void;
}) {
  return (
    <div className="max-w-[33.33%] sm:max-w-[25%] p-0.5">
      <Button
        onClick={onClick}
        variant="warning-ghost"
        className="w-full flex border border-warning/16 items-center gap-0.75 justify-center text-xs px-2 py-1 rounded-full bg-warning/10 text-warning"
        type="button"
        forceMinSize="medium"
      >
        <Icon className="size-3.5 shrink-0 -ml-0.25" />
        <span className="shrink whitespace-nowrap overflow-hidden overflow-ellipsis min-w-0 text-xs font-semibold">
          {children}
        </span>
        <XIcon className="size-3.5 shrink-0 -ml-0.25 -mr-0.75" />
      </Button>
    </div>
  );
}
