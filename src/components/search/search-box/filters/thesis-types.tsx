import ScrollTextIcon from "@/components/icons/scroll-text-icon";
import ThesisTypeIconWithFont from "@/components/icons/sets/thesis-type-with-font";
import FilterCountChip from "@/components/search/filter-count-chip";
import { toggleInArray } from "@/components/search/helpers";
import MultiSelectCombobox from "@/components/search/multi-select-combobox";
import { useSearchLikePageParam } from "@/components/search/query-param-provider";
import { useUmami } from "@/lib/hooks/use-umami";
import { TGetThesisTypesResult } from "@/server/meili/repo/thesis-type";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useMemo } from "react";

type Props = {
  thesisTypesData: TGetThesisTypesResult["hits"];
};

const eventData: [string, Record<string, string>] = [
  "Filtered",
  {
    "Filter Type": "Thesis Types",
  },
];

export default function ThesisTypesField({ thesisTypesData }: Props) {
  const [thesisTypes, setThesisTypes] = useSearchLikePageParam.thesis_types();

  const umami = useUmami();
  const posthog = usePostHog();

  const clearThesisTypes = useCallback(() => {
    setThesisTypes([]);
  }, [setThesisTypes]);

  useEffect(() => {
    if (!thesisTypes || thesisTypes.length < 1) return;
    umami.capture(...eventData);
    posthog.capture(...eventData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thesisTypes]);

  const thesisTypeOptions = useMemo(
    () =>
      thesisTypesData.map((u) => ({
        value: u.name,
        label: u.name,
      })),
    [thesisTypesData]
  );

  return (
    <MultiSelectCombobox
      label="Tez Türü Bazlı Filtrele"
      className="w-full"
      Icon={ScrollTextIcon}
      IconSetForItem={ThesisTypeIconWithFont}
      commandButtonText={
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
            Tez Türü
          </p>
          {thesisTypes && thesisTypes.length > 0 && (
            <FilterCountChip>
              {thesisTypes.length.toLocaleString()}
            </FilterCountChip>
          )}
        </div>
      }
      commandInputPlaceholder="Tez türü ara..."
      commandEmptyText="Eşleşen yok"
      isItemSelected={(v) => thesisTypes?.includes(v) || false}
      items={thesisTypeOptions}
      onClearButtonClick={clearThesisTypes}
      clearLength={thesisTypes?.length}
      onSelect={(v) => {
        const newValue = toggleInArray(thesisTypes, v);
        if (thesisTypes.join(",") !== newValue.join(",")) {
          setThesisTypes(newValue);
        }
      }}
    />
  );
}
