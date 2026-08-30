"use client";

import { useCallback, useMemo, useState } from "react";
import { compareSortValues, type SortableValue } from "@/lib/sort/compareSortValues";
import type { UniversalSortDir } from "@/types/universalListView";

export function useClientTableSort<
  T,
  G extends Record<string, (row: T) => SortableValue>,
>(
  rows: readonly T[],
  getters: G,
  defaultKey: keyof G & string,
  defaultDir: UniversalSortDir = "asc",
) {
  const [sortKey, setSortKey] = useState<keyof G & string>(defaultKey);
  const [sortDir, setSortDir] = useState<UniversalSortDir>(defaultDir);

  const onToggleSort = useCallback(
    (columnId: string) => {
      if (!(columnId in getters)) return;
      const key = columnId as keyof G & string;
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return;
      }
      setSortKey(key);
      setSortDir("asc");
    },
    [getters, sortKey],
  );

  const sortedRows = useMemo(() => {
    const get = getters[sortKey];
    if (!get) return [...rows];
    return [...rows].sort((a, b) => compareSortValues(get(a), get(b), sortDir));
  }, [getters, rows, sortDir, sortKey]);

  return { sortKey, sortDir, onToggleSort, sortedRows };
}
