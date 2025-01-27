import {
  searchLikePageParamKeys,
  searchLikePageParamParsers,
} from "@/components/search/constants";
import AdvisorsField from "@/components/search/search-box/filters/advisors";
import AuthorsField from "@/components/search/search-box/filters/authors";
import DepartmentsField from "@/components/search/search-box/filters/departments";
import LanguagesField from "@/components/search/search-box/filters/languages";
import SearchOnField from "@/components/search/search-box/filters/search-on";
import ThesisTypesField from "@/components/search/search-box/filters/thesis-types";
import UniversitiesField from "@/components/search/search-box/filters/universities";
import YearsField from "@/components/search/search-box/filters/years";
import { cn } from "@/components/ui/utils";
import { TGetLanguagesResult } from "@/server/meili/repo/language";
import { TGetThesisTypesResult } from "@/server/meili/repo/thesis-type";
import { TGetUniversitiesResult } from "@/server/meili/repo/university";
import { useQueryState } from "nuqs";

type Props = {
  className?: string;
  universitiesData: TGetUniversitiesResult["hits"];
  languagesData: TGetLanguagesResult["hits"];
  thesisTypesData: TGetThesisTypesResult["hits"];
};

export default function AdvancedFiltersSection({
  className,
  universitiesData,
  languagesData,
  thesisTypesData,
}: Props) {
  const [advancedSearch] = useQueryState(
    searchLikePageParamKeys.advanced,
    searchLikePageParamParsers.advanced
  );
  return (
    advancedSearch && (
      <div
        className={cn(
          "w-full max-w-3xl flex justify-center flex-wrap",
          className
        )}
      >
        <FieldWrapper>
          <SearchOnField />
        </FieldWrapper>
        <FieldWrapper>
          <YearsField />
        </FieldWrapper>
        <FieldWrapper>
          <UniversitiesField universitiesData={universitiesData} />
        </FieldWrapper>
        <FieldWrapper>
          <DepartmentsField />
        </FieldWrapper>
        <FieldWrapper>
          <ThesisTypesField thesisTypesData={thesisTypesData} />
        </FieldWrapper>
        <FieldWrapper>
          <LanguagesField languagesData={languagesData} />
        </FieldWrapper>
        <FieldWrapper>
          <AuthorsField />
        </FieldWrapper>
        <FieldWrapper>
          <AdvisorsField />
        </FieldWrapper>
      </div>
    )
  );
}

function FieldWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full sm:w-1/2 md:w-1/3 px-1 py-1 flex items-center">
      {children}
    </div>
  );
}
