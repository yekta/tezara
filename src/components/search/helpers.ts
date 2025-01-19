export const cleanAdvisors = (advisors?: string[] | null) => {
  if (!advisors) return [];
  return advisors.filter((advisor) => !advisor.includes("Yer Bilgisi:"));
};

export function getSearchThesesQueryKey({
  query,
  languages,
  universities,
  thesisTypes,
  yearGte,
  yearLte,
  hitsPerPage,
  page,
}: {
  query: string | undefined;
  languages: string[] | undefined;
  universities: string[] | undefined;
  thesisTypes: string[] | undefined;
  yearGte: number | null;
  yearLte: number | null;
  hitsPerPage: number | undefined;
  page: number | undefined;
}) {
  return [
    query,
    languages && languages.length ? languages.join("_") : undefined,
    universities && universities.length ? universities.join("_") : undefined,
    thesisTypes && thesisTypes.length ? thesisTypes.join("_") : undefined,
    yearGte !== undefined ? yearGte : undefined,
    yearLte !== undefined ? yearLte : undefined,
    hitsPerPage !== undefined ? hitsPerPage : undefined,
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
