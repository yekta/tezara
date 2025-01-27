export const isNonEmpty = (v: string) =>
  v !== "" && v !== null && v !== undefined;

export const optionsPlaceholder = Array.from({ length: 20 }).map((_, i) => ({
  label: `Yükleniyor ${i + 1}`,
  value: `Yükleniyor ${i + 1}`,
}));
