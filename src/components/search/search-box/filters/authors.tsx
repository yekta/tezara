import PenToolIcon from "@/components/icons/pen-tool";
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
import { searchAuthors } from "@/server/meili/repo/author";
import { useQuery } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useMemo } from "react";

const eventData: [string, Record<string, string>] = [
  "Filtered",
  {
    "Filter Type": "Authors",
  },
];

export default function AuthorsField() {
  const [authors, setAuthors] = useSearchLikePageParam.authors();
  const [queryAuthors, setQueryAuthors, debouncedQueryAuthors] = useDebounceIf(
    "",
    isNonEmpty,
    150
  );

  const umami = useUmami();
  const posthog = usePostHog();

  const clearAuthors = useCallback(() => {
    setAuthors([]);
  }, [setAuthors]);

  useEffect(() => {
    if (!authors || authors.length < 1) return;
    umami.capture(...eventData);
    posthog.capture(...eventData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authors]);

  const {
    data: authorsData,
    isPending: isPendingAuthors,
    isFetching: isFetchingAuthors,
    isError: isErrorAuthors,
  } = useQuery({
    queryKey: [
      "authors",
      debouncedQueryAuthors ? debouncedQueryAuthors : undefined,
    ],
    queryFn: () =>
      searchAuthors({
        q: debouncedQueryAuthors,
        page: 1,
        sort: undefined,
        client: meili,
      }),
    placeholderData: (prev) => prev,
  });

  const authorOptions = useMemo(
    () =>
      authorsData?.hits.map((d) => ({
        value: d.name,
        label: d.name,
      })) || null,
    [authorsData]
  );

  return (
    <MultiSelectCombobox
      commandFilter={() => 1}
      label="Yazar Bazlı Filtrele"
      className="w-full"
      Icon={PenToolIcon}
      commandInputValue={queryAuthors}
      commandInputOnValueChange={(v) => setQueryAuthors(v)}
      isAsync
      isPending={isPendingAuthors}
      isFetching={isFetchingAuthors}
      isError={isErrorAuthors}
      hasNext={
        !isPendingAuthors &&
        !isErrorAuthors &&
        authorOptions !== null &&
        authorsData.totalPages > 1
      }
      toLoadMoreText={"Diğerleri için arama yap"}
      items={authorOptions ? authorOptions : optionsPlaceholder}
      commandButtonText={
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
            Yazar
          </p>
          {authors && authors.length > 0 && (
            <FilterCountChip>{authors.length.toLocaleString()}</FilterCountChip>
          )}
        </div>
      }
      commandInputPlaceholder="Yazar ara..."
      commandEmptyText="Eşleşen yok"
      commandErrorText="Bir şeyler ters gitti"
      isItemSelected={(v) => authors?.includes(v) || false}
      onClearButtonClick={clearAuthors}
      clearLength={authors?.length}
      onSelect={(v) => {
        const newValue = toggleInArray(authors, v);
        if (authors.join(",") !== newValue.join(",")) {
          setAuthors(newValue);
        }
      }}
    />
  );
}
