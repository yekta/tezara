import {
  searchLikePageParamParsers,
  searchLikePageParamKeys,
  TAttributesToSearchOn,
} from "@/components/search/constants";
import FilterCountChip from "@/components/search/filter-count-chip";
import { toggleInArray } from "@/components/search/helpers";
import MultiSelectCombobox from "@/components/search/multi-select-combobox";
import { useUmami } from "@/lib/hooks/use-umami";
import { SearchCheckIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { usePostHog } from "posthog-js/react";
import { useCallback } from "react";

export default function SearchOnField() {
  const [searchOn, setSearchOn] = useQueryState(
    searchLikePageParamKeys.search_on,
    searchLikePageParamParsers.search_on
  );

  const umami = useUmami();
  const posthog = usePostHog();

  const clearSearchOn = useCallback(() => {
    setSearchOn([]);
  }, [setSearchOn]);

  return (
    <MultiSelectCombobox
      label="Arama Alanı Seç"
      className="w-full"
      triggerOnClick={() => {
        umami.capture("Search On Filter Clicked");
        posthog.capture("Search On Filter Clicked");
      }}
      Icon={SearchCheckIcon}
      commandButtonText={
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
            Arama Alanı
          </p>
          {searchOn && searchOn.length > 0 && (
            <FilterCountChip>
              {searchOn.length.toLocaleString()}
            </FilterCountChip>
          )}
        </div>
      }
      commandInputPlaceholder="Alan bul..."
      commandEmptyText="Eşleşen yok"
      isItemSelected={(value) => {
        if (!searchOn) return false;
        return searchOn.includes(value as TAttributesToSearchOn);
      }}
      items={searchOnOptions}
      onClearButtonClick={clearSearchOn}
      clearLength={searchOn?.length}
      onSelect={(label) => {
        const matchingOption = searchOnOptions.find((o) => o.label === label);
        if (!matchingOption) return;
        const newValue = toggleInArray(searchOn, matchingOption.value);
        if (searchOn.join(",") !== newValue.join(",")) {
          setSearchOn(newValue);
        }
      }}
    />
  );
}

const searchOnOptions: { value: TAttributesToSearchOn; label: string }[] = [
  {
    value: "title",
    label: "Başlık",
  },
  {
    value: "abstract",
    label: "Özet",
  },
  {
    value: "subjects",
    label: "Konular",
  },
  {
    value: "keywords",
    label: "Anahtar Kelimeler",
  },
  {
    value: "author",
    label: "Yazar",
  },
  {
    value: "advisors",
    label: "Danışmanlar",
  },
];
