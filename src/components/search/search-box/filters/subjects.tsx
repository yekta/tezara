import FolderClosedIcon from "@/components/icons/folder-closed";
import FilterCountChip from "@/components/search/filter-count-chip";
import { toggleInArray } from "@/components/search/helpers";
import MultiSelectCombobox from "@/components/search/multi-select-combobox";
import { useSearchLikePageParam } from "@/components/search/query-param-provider";
import { useUmami } from "@/lib/hooks/use-umami";
import { TGetSubjectsResult } from "@/server/meili/repo/subject";
import { usePostHog } from "posthog-js/react";
import { useCallback, useMemo } from "react";

type Props = {
  subjectsData: TGetSubjectsResult["hits"];
};

export default function SubjectsField({ subjectsData }: Props) {
  const [subjects, setSubjects] = useSearchLikePageParam.subjects();

  const umami = useUmami();
  const posthog = usePostHog();

  const clearSubjects = useCallback(() => {
    setSubjects([]);
  }, [setSubjects]);

  const subjectOptions = useMemo(
    () =>
      subjectsData.map((i) => ({
        value: i.name,
        label: i.name,
      })),
    [subjectsData]
  );

  return (
    <MultiSelectCombobox
      label="Konu Bazlı Filterele"
      className="w-full"
      triggerOnClick={() => {
        umami.capture("Subject Filter Clicked");
        posthog.capture("Subject Filter Clicked");
      }}
      Icon={FolderClosedIcon}
      commandButtonText={
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <p className="shrink min-w-0 overflow-ellipsis overflow-hidden whitespace-nowrap">
            Konu
          </p>
          {subjects && subjects.length > 0 && (
            <FilterCountChip>
              {subjects.length.toLocaleString()}
            </FilterCountChip>
          )}
        </div>
      }
      commandInputPlaceholder="Konu ara..."
      commandEmptyText="Eşleşen yok"
      isItemSelected={(v) => subjects?.includes(v) || false}
      items={subjectOptions}
      onClearButtonClick={clearSubjects}
      clearLength={subjects?.length}
      onSelect={(v) => {
        const newValue = toggleInArray(subjects, v);
        if (subjects.join(",") !== newValue.join(",")) {
          setSubjects(newValue);
        }
      }}
    />
  );
}
