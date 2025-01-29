import BroomIcon from "@/components/icons/broom";
import { useSearchLikePageParam } from "@/components/search/query-param-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUmami } from "@/lib/hooks/use-umami";
import { yearGteKeyAtom, yearLteKeyAtom } from "@/lib/store/main";
import { useAtom } from "jotai";
import { CalendarArrowDownIcon, CalendarArrowUpIcon } from "lucide-react";
import { usePostHog } from "posthog-js/react";

const clearButtonText = "Temizle";

const minYear = 1950;
const maxYear = new Date().getFullYear();
const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => ({
  value: `${maxYear - i}`,
  label: `${maxYear - i}`,
}));

export default function YearsField() {
  const [yearGte, setYearGte] = useSearchLikePageParam.year_gte();
  const [yearLte, setYearLte] = useSearchLikePageParam.year_lte();

  const [yearGteKey, setYearGteKey] = useAtom(yearGteKeyAtom);
  const [yearLteKey, setYearLteKey] = useAtom(yearLteKeyAtom);

  const umami = useUmami();
  const posthog = usePostHog();

  const clearYearGte = () => {
    setYearGte(null);
    setYearGteKey((k) => k + 1);
  };
  const clearYearLte = () => {
    setYearLte(null);
    setYearLteKey((k) => k + 1);
  };

  return (
    <>
      {/* Year Gte */}
      <Select
        key={`year-gte-${yearGteKey}`}
        onOpenChange={(o) => {
          if (o) {
            umami.capture("Year GTE Filter Clicked");
            posthog.capture("Year GTE Filter Clicked");
          }
        }}
        value={yearGte?.toString()}
        onValueChange={(v) => {
          if (v === clearButtonText) {
            clearYearGte();
            return;
          }
          const year = parseInt(v);
          if (v === undefined || v === null || v === "" || isNaN(year)) {
            setYearGte(null);
          } else if (year !== yearGte) {
            setYearGte(year);
          }
        }}
      >
        <SelectTrigger
          aria-label="Minimum Yılı Seç"
          className="flex-1 py-2 rounded-r-none -mr-[0.5px]"
          classNameInnerContainer="flex items-center -ml-0.5"
        >
          <CalendarArrowUpIcon className="size-4 shrink-0" />
          <SelectValue placeholder="Yıl >=">
            <div className="flex shrink min-w-0 items-center gap-0.5 overflow-hidden">
              <p className="shrink min-w-0 overflow-hidden overflow-ellipsis">
                {yearGte ? yearGte : `Yıl >=`}
              </p>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="p-1 w-[--radix-popper-anchor-width]">
          {yearGte && (
            <SelectItem
              value={clearButtonText}
              className="data-[highlighted]:bg-warning/20"
              hideTick
            >
              <div className="shrink min-w-0 flex items-center gap-1 text-warning">
                <BroomIcon className="size-4 -my-1" />
                <p className="shrink font-semibold min-w-0 overflow-hidden overflow-ellipsis">
                  {clearButtonText}
                </p>
              </div>
            </SelectItem>
          )}
          {yearOptions.map((y) => (
            <SelectItem key={y.value} value={y.value}>
              {y.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Year LTE */}
      <Select
        key={`year-lte-${yearLteKey}`}
        onOpenChange={(o) => {
          if (o) {
            umami.capture("Year LTE Filter Clicked");
            posthog.capture("Year LTE Filter Clicked");
          }
        }}
        value={yearLte?.toString()}
        onValueChange={(v) => {
          if (v === clearButtonText) {
            clearYearLte();
            return;
          }
          const year = parseInt(v);
          if (v === undefined || v === null || v === "" || isNaN(year)) {
            setYearLte(null);
          } else if (year !== yearLte) {
            setYearLte(year);
          }
        }}
      >
        <SelectTrigger
          aria-label="Maksimum Yılı Seç"
          className="flex-1 py-2 rounded-l-none -ml-[0.5px]"
          classNameInnerContainer="flex items-center -ml-0.5"
        >
          <CalendarArrowDownIcon className="size-4 shrink-0" />
          <SelectValue placeholder="Yıl <=">
            <div className="flex shrink min-w-0 items-center gap-0.5 overflow-hidden">
              <p className="shrink min-w-0 overflow-hidden overflow-ellipsis">
                {yearLte ? yearLte : `Yıl <=`}
              </p>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="p-1 w-[--radix-popper-anchor-width]">
          {yearLte && (
            <SelectItem
              className="data-[highlighted]:bg-warning/20"
              value={clearButtonText}
              hideTick
            >
              <div className="shrink min-w-0 flex items-center gap-1 text-warning">
                <BroomIcon className="size-4 -my-1" />
                <p className="shrink font-semibold min-w-0 overflow-hidden overflow-ellipsis">
                  {clearButtonText}
                </p>
              </div>
            </SelectItem>
          )}
          {yearOptions.map((y) => (
            <SelectItem key={y.value} value={y.value}>
              {y.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
