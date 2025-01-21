import ThesisSearchResultRow from "@/components/search/results/thesis-search-result-row";
import { cn } from "@/components/ui/utils";
import { TSearchThesesResult } from "@/server/meili/repo/thesis";

type Props = {
  className?: string;
  classNameRow?: string;
  disableUniversityLink?: boolean;
  data: TSearchThesesResult | undefined;
};

export default function ThesisSearchResultRowList({
  data,
  disableUniversityLink,
  className,
  classNameRow,
}: Props) {
  return (
    <ol className={cn("w-full flex-1 flex flex-col", className)}>
      {data
        ? data.hits.map((i, index) => (
            <ThesisSearchResultRow
              className={classNameRow}
              disableUniversityLink={disableUniversityLink}
              key={`${i.id}-${index}`}
              thesis={i}
            />
          ))
        : Array.from({ length: 20 }).map((i, index) => (
            <ThesisSearchResultRow
              className={classNameRow}
              disableUniversityLink={disableUniversityLink}
              key={index}
              isPlaceholder
            />
          ))}
    </ol>
  );
}
