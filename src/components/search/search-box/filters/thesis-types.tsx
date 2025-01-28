import ScrollTextIcon from "@/components/icons/scroll-text-icon";
import ThesisTypeIcon from "@/components/icons/sets/thesis-type";
import FilterCountChip from "@/components/search/filter-count-chip";
import { toggleInArray } from "@/components/search/helpers";
import MultiSelectCombobox from "@/components/search/multi-select-combobox";
import { useSearchLikePageParam } from "@/components/search/search-box/query-param-provider";
import { useUmami } from "@/lib/hooks/use-umami";
import { TGetThesisTypesResult } from "@/server/meili/repo/thesis-type";
import { usePostHog } from "posthog-js/react";
import { useCallback, useMemo } from "react";

type Props = {
  thesisTypesData: TGetThesisTypesResult["hits"];
};

export default function ThesisTypesField({ thesisTypesData }: Props) {
  const [thesisTypes, setThesisTypes] = useSearchLikePageParam.thesis_types();

  const umami = useUmami();
  const posthog = usePostHog();

  const clearThesisTypes = useCallback(() => {
    setThesisTypes([]);
  }, [setThesisTypes]);

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
      triggerOnClick={() => {
        umami.capture("Thesis Type Filter Clicked");
        posthog.capture("Thesis Type Filter Clicked");
      }}
      Icon={ScrollTextIcon}
      IconSetForItem={ThesisTypeIcon}
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
