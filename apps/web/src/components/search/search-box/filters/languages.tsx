import GlobeIcon from "@/components/icons/globe";
import LanguageIcon from "@/components/icons/language";
import FilterCountChip from "@/components/search/filter-count-chip";
import { toggleInArray } from "@/components/search/helpers";
import MultiSelectCombobox from "@/components/search/multi-select-combobox";
import { useSearchLikePageParam } from "@/components/search/query-param-provider";
import { useUmami } from "@/lib/hooks/use-umami";
import { TGetLanguagesResult } from "@/server/meili/repo/language";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useMemo } from "react";

type Props = {
  languagesData: TGetLanguagesResult["hits"];
};

const eventData: [string, Record<string, string>] = [
  "Filtered",
  {
    "Filter Type": "Languages",
  },
];

export default function LanguagesField({ languagesData }: Props) {
  const [languages, setLanguages] = useSearchLikePageParam.languages();

  const umami = useUmami();
  const posthog = usePostHog();

  const clearLanguages = useCallback(() => {
    setLanguages([]);
  }, [setLanguages]);

  useEffect(() => {
    if (!languages || languages.length < 1) return;
    umami.capture(...eventData);
    posthog.capture(...eventData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languages]);

  const languageOptions = useMemo(
    () =>
      languagesData.map((u) => ({
        value: u.name,
        label: u.name,
      })),
    [languagesData]
  );

  return (
    <MultiSelectCombobox
      label="Dil Bazlı Filtrele"
      className="w-full"
      Icon={GlobeIcon}
      IconSetForItem={LanguageIcon}
      iconSetForItemClassName="rounded-full"
      commandButtonText={
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
            Dil
          </p>
          {languages && languages.length > 0 && (
            <FilterCountChip>
              {languages.length.toLocaleString()}
            </FilterCountChip>
          )}
        </div>
      }
      commandInputPlaceholder="Dil ara..."
      commandEmptyText="Eşleşen yok"
      isItemSelected={(v) => languages?.includes(v) || false}
      items={languageOptions}
      onClearButtonClick={clearLanguages}
      clearLength={languages?.length}
      onSelect={(v) => {
        const newValue = toggleInArray(languages, v);
        if (languages.join(",") !== newValue.join(",")) {
          setLanguages(newValue);
        }
      }}
    />
  );
}
