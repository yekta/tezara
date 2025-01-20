import { TSearchLikePageParams } from "@/components/search/constants/client";

export const cleanAdvisors = (advisors?: string[] | null) => {
  if (!advisors) return [];
  return advisors.filter((advisor) => !advisor.includes("Yer Bilgisi:"));
};

type TGetSearchThesesQueryKeyParams = Omit<
  TSearchLikePageParams,
  "advanced"
> & {
  hits_per_page: number | undefined;
};

export function getSearchThesesQueryKey({
  q,
  languages,
  universities,
  advisors,
  authors,
  thesis_types,
  year_gte,
  year_lte,
  hits_per_page,
  page,
}: TGetSearchThesesQueryKeyParams) {
  return [
    "searchTheses",
    q,
    languages && languages.length ? languages.join("_") : undefined,
    universities && universities.length ? universities.join("_") : undefined,
    advisors && advisors.length ? advisors.join("_") : undefined,
    authors && authors.length ? authors.join("_") : undefined,
    thesis_types && thesis_types.length ? thesis_types.join("_") : undefined,
    year_gte !== null ? year_gte : undefined,
    year_lte !== null ? year_lte : undefined,
    hits_per_page !== undefined ? hits_per_page : undefined,
    page !== undefined ? page : undefined,
  ];
}

export function toggleInArray<T>(arr: T[], item: T) {
  if (!arr) return [item];
  if (arr.includes(item)) {
    return removeFromArray(arr, item);
  }
  return addToArray(arr, item);
}

function removeFromArray<T>(arr: T[], item: T) {
  if (!arr) return [];
  return arr.filter((i) => i !== item);
}

function addToArray<T>(arr: T[], item: T) {
  if (!arr) return [item];
  return [...arr, item];
}
