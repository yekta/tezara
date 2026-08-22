export function boostedStringSort<T extends Record<string, unknown>>({
  boost,
  hinder,
  field,
}: {
  boost?: string[];
  hinder?: string[] | ((i: string) => boolean)[];
  field: keyof T;
}) {
  return (a: T, b: T) => {
    if (boost) {
      const idxA = boost.indexOf(String(a[field]));
      const idxB = boost.indexOf(String(b[field]));
      if (idxA !== -1 && idxB !== -1) {
        return idxA - idxB;
      }
      if (idxA !== undefined && idxA !== -1) {
        return -1;
      }
      if (idxB !== undefined && idxB !== -1) {
        return 1;
      }
    }

    if (hinder) {
      let hIdxA = undefined;
      let hIdxB = undefined;
      if (hinder.every((h) => typeof h === "function")) {
        hIdxA = hinder.findIndex((h) => h(String(a[field])));
        hIdxB = hinder.findIndex((h) => h(String(b[field])));
        return hIdxA - hIdxB;
      } else {
        hIdxA = hinder.indexOf(String(a[field]));
        hIdxB = hinder.indexOf(String(b[field]));
      }
      if (hIdxA !== -1 && hIdxB !== -1) {
        return hIdxA - hIdxB;
      }
      if (hIdxA !== undefined && hIdxA !== -1) {
        return 1;
      }
      if (hIdxB !== undefined && hIdxB !== -1) {
        return -1;
      }
    }

    return 0;
  };
}
