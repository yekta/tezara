import UserPenIcon from "@/components/icons/user-pen";
import FilterCountChip from "@/components/search/filter-count-chip";
import { toggleInArray } from "@/components/search/helpers";
import MultiSelectCombobox from "@/components/search/multi-select-combobox";
import {
  isNonEmpty,
  optionsPlaceholder,
} from "@/components/search/search-box/filters/helpers";
import { useSearchLikePageParam } from "@/components/search/query-param-provider";
import useDebounceIf from "@/lib/hooks/use-debounce-if";
import { useUmami } from "@/lib/hooks/use-umami";
import { meili } from "@/server/meili/constants-client";
import { searchAdvisors } from "@/server/meili/repo/advisor";
import { useQuery } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useMemo } from "react";

const eventData: [string, Record<string, string>] = [
  "Filtered",
  {
    "Filter Type": "Advisors",
  },
];

export default function AdvisorsField() {
  const [advisors, setAdvisors] = useSearchLikePageParam.advisors();
  const [queryAdvisors, setQueryAdvisors, debouncedQueryAdvisors] =
    useDebounceIf("", isNonEmpty, 150);

  const umami = useUmami();
  const posthog = usePostHog();

  const clearAdvisors = useCallback(() => {
    setAdvisors([]);
  }, [setAdvisors]);

  useEffect(() => {
    if (!advisors || advisors.length < 1) return;
    umami.capture(...eventData);
    posthog.capture(...eventData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisors]);

  const {
    data: advisorsData,
    isPending: isPendingAdvisors,
    isFetching: isFetchingAdvisors,
    isError: isErrorAdvisors,
  } = useQuery({
    queryKey: [
      "advisors",
      debouncedQueryAdvisors ? debouncedQueryAdvisors : undefined,
    ],
    queryFn: () =>
      searchAdvisors({
        q: debouncedQueryAdvisors,
        page: 1,
        sort: undefined,
        client: meili,
      }),
    placeholderData: (prev) => prev,
  });

  const advisorOptions = useMemo(
    () =>
      advisorsData?.hits.map((d) => ({
        value: d.name,
        label: d.name,
      })) || null,
    [advisorsData]
  );

  return (
    <MultiSelectCombobox
      commandFilter={() => 1}
      label="Danışman Bazlı Filtrele"
      className="w-full"
      Icon={UserPenIcon}
      commandInputValue={queryAdvisors}
      commandInputOnValueChange={(v) => {
        setQueryAdvisors(v);
        umami.capture(...eventData);
        posthog.capture(...eventData);
      }}
      isAsync
      isPending={isPendingAdvisors}
      isFetching={isFetchingAdvisors}
      isError={isErrorAdvisors}
      hasNext={
        !isPendingAdvisors &&
        !isErrorAdvisors &&
        advisorOptions !== null &&
        advisorsData.totalPages > 1
      }
      toLoadMoreText={"Diğerleri için arama yap"}
      items={advisorOptions ? advisorOptions : optionsPlaceholder}
      commandButtonText={
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
            Danışman
          </p>
          {advisors && advisors.length > 0 && (
            <FilterCountChip>
              {advisors.length.toLocaleString()}
            </FilterCountChip>
          )}
        </div>
      }
      commandInputPlaceholder="Danışman ara..."
      commandEmptyText="Eşleşen yok"
      commandErrorText="Bir şeyler ters gitti"
      isItemSelected={(v) => advisors?.includes(v) || false}
      onClearButtonClick={clearAdvisors}
      clearLength={advisors?.length}
      onSelect={(v) => {
        const newValue = toggleInArray(advisors, v);
        if (advisors.join(",") !== newValue.join(",")) {
          setAdvisors(newValue);
        }
      }}
    />
  );
}
