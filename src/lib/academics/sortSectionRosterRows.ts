import type { SectionRosterRow } from "@/types/sectionRoster";

export type SectionRosterSortKey = "label" | "status";

export type SectionRosterSortableRow = Pick<SectionRosterRow, "label" | "status">;

export function sortSectionRosterRows<T extends SectionRosterSortableRow>(
  rows: T[],
  sortKey: SectionRosterSortKey,
  dir: "asc" | "desc",
): T[] {
  const mult = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = sortKey === "status" ? a.status : a.label;
    const vb = sortKey === "status" ? b.status : b.label;
    return va.localeCompare(vb, undefined, { sensitivity: "base" }) * mult;
  });
}
