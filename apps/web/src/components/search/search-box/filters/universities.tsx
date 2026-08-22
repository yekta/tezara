import LandmarkIcon from "@/components/icons/landmark";
import FilterCountChip from "@/components/search/filter-count-chip";
import { toggleInArray } from "@/components/search/helpers";
import MultiSelectCombobox from "@/components/search/multi-select-combobox";
import { useSearchLikePageParam } from "@/components/search/query-param-provider";
import { useUmami } from "@/lib/hooks/use-umami";
import { TGetUniversitiesResult } from "@/server/meili/repo/university";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useMemo } from "react";

type Props = {
  universitiesData: TGetUniversitiesResult["hits"];
};

const eventData: [string, Record<string, string>] = [
  "Filtered",
  {
    "Filter Type": "Universities",
  },
];

export default function UniversitiesField({ universitiesData }: Props) {
  const [universities, setUniversities] = useSearchLikePageParam.universities();

  const umami = useUmami();
  const posthog = usePostHog();

  const clearUniversities = useCallback(() => {
    setUniversities([]);
  }, [setUniversities]);

  useEffect(() => {
    if (!universities || universities.length < 1) return;
    umami.capture(...eventData);
    posthog.capture(...eventData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universities]);

  const universityOptions = useMemo(
    () =>
      universitiesData.map((u) => ({
        value: u.name,
        label: u.name,
      })),
    [universitiesData]
  );

  return (
    <MultiSelectCombobox
      label="Üniversite Bazlı Filterele"
      className="w-full"
      Icon={LandmarkIcon}
      commandButtonText={
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
            Üniversite
          </p>
          {universities && universities.length > 0 && (
            <FilterCountChip>
              {universities.length.toLocaleString()}
            </FilterCountChip>
          )}
        </div>
      }
      commandInputPlaceholder="Üniversite ara..."
      commandEmptyText="Eşleşen yok"
      isItemSelected={(v) => universities?.includes(v) || false}
      items={universityOptions}
      onClearButtonClick={clearUniversities}
      clearLength={universities?.length}
      onSelect={(v) => {
        const newValue = toggleInArray(universities, v);
        if (universities.join(",") !== newValue.join(",")) {
          setUniversities(newValue);
        }
      }}
    />
  );
}
