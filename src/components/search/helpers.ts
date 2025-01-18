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
