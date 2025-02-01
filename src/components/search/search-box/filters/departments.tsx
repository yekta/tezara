import BuildingIcon from "@/components/icons/building";
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
import { searchDepartments } from "@/server/meili/repo/department";
import { useQuery } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useMemo } from "react";

const eventData: [string, Record<string, string>] = [
  "Filtered",
  {
    "Filter Type": "Departments",
  },
];

export default function DepartmentsField() {
  const [departments, setDepartments] = useSearchLikePageParam.departments();
  const [queryDepartments, setQueryDepartments, debouncedQueryDepartments] =
    useDebounceIf("", isNonEmpty, 150);

  const umami = useUmami();
  const posthog = usePostHog();

  const clearDepartments = useCallback(() => {
    setDepartments([]);
  }, [setDepartments]);

  useEffect(() => {
    if (!departments || departments.length < 1) return;
    umami.capture(...eventData);
    posthog.capture(...eventData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments]);

  const {
    data: departmentsData,
    isPending: isPendingDepartments,
    isFetching: isFetchingDepartments,
    isError: isErrorDepartments,
  } = useQuery({
    queryKey: [
      "departments",
      debouncedQueryDepartments ? debouncedQueryDepartments : undefined,
    ],
    queryFn: () =>
      searchDepartments({
        q: debouncedQueryDepartments,
        page: 1,
        sort: undefined,
        client: meili,
      }),
    placeholderData: (prev) => prev,
  });

  const departmentOptions = useMemo(
    () =>
      departmentsData?.hits.map((d) => ({
        value: d.name,
        label: d.name,
      })) || null,
    [departmentsData]
  );

  return (
    <MultiSelectCombobox
      commandFilter={() => 1}
      label="Ana Bilim Dalı Bazlı Filtrele"
      className="w-full"
      Icon={BuildingIcon}
      commandInputValue={queryDepartments}
      commandInputOnValueChange={(v) => setQueryDepartments(v)}
      isAsync
      isPending={isPendingDepartments}
      isFetching={isFetchingDepartments}
      isError={isErrorDepartments}
      hasNext={
        !isPendingDepartments &&
        !isErrorDepartments &&
        departmentOptions !== null &&
        departmentsData.totalPages > 1
      }
      toLoadMoreText={"Diğerleri için arama yap"}
      items={departmentOptions ? departmentOptions : optionsPlaceholder}
      commandButtonText={
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
            Ana Bilim Dalı
          </p>
          {departments && departments.length > 0 && (
            <FilterCountChip>
              {departments.length.toLocaleString()}
            </FilterCountChip>
          )}
        </div>
      }
      commandInputPlaceholder="Ana bilim dalı ara..."
      commandEmptyText="Eşleşen yok"
      commandErrorText="Bir şeyler ters gitti"
      isItemSelected={(v) => departments?.includes(v) || false}
      onClearButtonClick={clearDepartments}
      clearLength={departments?.length}
      onSelect={(v) => {
        const newValue = toggleInArray(departments, v);
        if (departments.join(",") !== newValue.join(",")) {
          setDepartments(newValue);
        }
      }}
    />
  );
}
