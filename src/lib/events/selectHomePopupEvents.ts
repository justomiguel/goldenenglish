export const HOME_EVENT_POPUP_LIMIT = 8;

export interface HomePopupEventCandidate {
  id: string;
  status: string;
  archivedAt: string | null;
  privateToSection: boolean;
  showOnHome: boolean;
  eventDate: string;
}

export function selectHomePopupEvents<T extends HomePopupEventCandidate>(
  rows: T[],
  now: Date,
): T[] {
  const nowMs = now.getTime();
  return rows
    .filter((row) => {
      if (!row.showOnHome || row.status !== "published" || row.privateToSection) return false;
      if (row.archivedAt) return false;
      const when = new Date(row.eventDate).getTime();
      return Number.isFinite(when) && when >= nowMs;
    })
    .toSorted((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, HOME_EVENT_POPUP_LIMIT);
}

/** Local popup rows plus shared rows. A guest slug that already exists stays local. */
export function mergeHomePopupEvents<T extends { slug: string; eventDate: string }>(input: {
  local: readonly T[];
  shared: readonly T[];
  takenSlugs: ReadonlySet<string>;
}): T[] {
  const shared = input.shared.filter((row) => !input.takenSlugs.has(row.slug));
  return [...input.local, ...shared]
    .toSorted((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, HOME_EVENT_POPUP_LIMIT);
}
