import type { UniversalSortDir } from "@/types/universalListView";

export type SortableValue = string | number | null | undefined;

export function compareSortValues(
  a: SortableValue,
  b: SortableValue,
  dir: UniversalSortDir,
): number {
  const mult = dir === "asc" ? 1 : -1;
  const aEmpty = a == null || a === "";
  const bEmpty = b == null || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;
  if (typeof a === "number" && typeof b === "number") {
    return (a - b) * mult;
  }
  return (
    String(a).localeCompare(String(b), undefined, {
      sensitivity: "base",
      numeric: true,
    }) * mult
  );
}
