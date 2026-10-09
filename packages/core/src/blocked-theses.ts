/**
 * Theses removed at the author's request. Comma-separated ids in `BLOCKED_THESES`;
 * both the web app and the crawler read the same variable.
 */
export function parseBlockedTheses(raw: string | undefined): Set<number> {
  const ids = new Set<number>();
  if (!raw) return ids;

  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!/^\d+$/.test(trimmed)) continue;
    const id = Number(trimmed);
    if (id < 1) continue;
    ids.add(id);
  }
  return ids;
}
