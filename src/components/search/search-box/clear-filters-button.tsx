import BroomIcon from "@/components/icons/broom";
import {
  searchLikePageParamKeys,
  searchLikePageParamParsers,
} from "@/components/search/constants";
import FilterCountChip from "@/components/search/filter-count-chip";
import { Button } from "@/components/ui/button";
import { yearGteKeyAtom, yearLteKeyAtom } from "@/lib/store/main";
import { useSetAtom } from "jotai";
import { useQueryState } from "nuqs";
import { useMemo } from "react";

const clearButtonText = "Temizle";

export default function ClearFiltersButton() {
  const [languages, setLanguages] = useQueryState(
    searchLikePageParamKeys.languages,
    searchLikePageParamParsers.languages
  );
  const [universities, setUniversities] = useQueryState(
    searchLikePageParamKeys.universities,
    searchLikePageParamParsers.universities
  );
  const [departments, setDepartments] = useQueryState(
    searchLikePageParamKeys.departments,
    searchLikePageParamParsers.departments
  );
  const [advisors, setAdvisors] = useQueryState(
    searchLikePageParamKeys.advisors,
    searchLikePageParamParsers.advisors
  );
  const [authors, setAuthors] = useQueryState(
    searchLikePageParamKeys.authors,
    searchLikePageParamParsers.authors
  );
  const [thesisTypes, setThesisTypes] = useQueryState(
    searchLikePageParamKeys.thesis_types,
    searchLikePageParamParsers.thesis_types
  );
  const [yearGte, setYearsGte] = useQueryState(
    searchLikePageParamKeys.year_gte,
    searchLikePageParamParsers.year_gte
  );
  const [yearLte, setYearLte] = useQueryState(
    searchLikePageParamKeys.year_lte,
    searchLikePageParamParsers.year_lte
  );
  const [searchOn, setSearchOn] = useQueryState(
    searchLikePageParamKeys.search_on,
    searchLikePageParamParsers.search_on
  );

  const totalSelectedFilters = useMemo(() => {
    let total = 0;
    if (languages) total += languages.length;
    if (universities) total += universities.length;
    if (departments) total += departments.length;
    if (advisors) total += advisors.length;
    if (authors) total += authors.length;
    if (thesisTypes) total += thesisTypes.length;
    if (yearLte !== null && yearLte !== undefined) total += 1;
    if (yearGte !== null && yearGte !== undefined) total += 1;
    if (searchOn) total += searchOn.length;
    return total;
  }, [
    languages,
    universities,
    departments,
    advisors,
    authors,
    thesisTypes,
    yearGte,
    yearLte,
    searchOn,
  ]);

  const setYearGteKey = useSetAtom(yearGteKeyAtom);
  const setYearLteKey = useSetAtom(yearLteKeyAtom);

  const clearAllFilters = () => {
    setLanguages([]);
    setUniversities([]);
    setDepartments([]);
    setAdvisors([]);
    setAuthors([]);
    setThesisTypes([]);
    setYearsGte(null);
    setYearGteKey((k) => k + 1);
    setYearLte(null);
    setYearLteKey((k) => k + 1);
    setSearchOn([]);
  };

  return (
    totalSelectedFilters > 0 && (
      <Button
        type="button"
        variant="warning-outline"
        className="font-semibold py-2 px-3.75"
        onClick={() => clearAllFilters()}
      >
        <div className="size-5 -ml-1 transform transition">
          <BroomIcon className="size-full" />
        </div>
        <p className="shrink min-w-0">{clearButtonText}</p>
        <FilterCountChip className="-ml-0.25">
          {totalSelectedFilters.toLocaleString()}
        </FilterCountChip>
      </Button>
    )
  );
}
