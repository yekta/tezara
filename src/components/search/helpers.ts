export const cleanAdvisors = (advisors?: string[] | null) => {
  if (!advisors) return [];
  return advisors.filter((advisor) => !advisor.includes("Yer Bilgisi:"));
};

export function getSearchThesesQueryKey({
  query,
  languages,
  universities,
  thesisTypes,
  limit,
  offset,
}: {
  query: string;
  languages?: string[];
  universities?: string[];
  thesisTypes?: string[];
  limit?: number;
  offset?: number;
}) {
  return [
    query,
    languages && languages.length ? languages.join("_") : undefined,
    universities && universities.length ? universities.join("_") : undefined,
    thesisTypes && thesisTypes.length ? thesisTypes.join("_") : undefined,
    limit !== undefined ? limit : undefined,
    offset !== undefined ? offset : undefined,
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
