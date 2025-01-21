export const cleanAdvisors = (advisors?: string[] | null) => {
  if (!advisors) return [];
  return advisors.filter((advisor) => !advisor.includes("Yer Bilgisi:"));
};

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
