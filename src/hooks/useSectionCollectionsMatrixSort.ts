"use client";

import { useCallback, useMemo, useState } from "react";
import type { SectionCollectionsStudentRow } from "@/types/sectionCollections";

export type CollectionsMatrixSortKey = "student" | "totals";

export function useSectionCollectionsMatrixSort(students: SectionCollectionsStudentRow[]) {
  const [sortKey, setSortKey] = useState<CollectionsMatrixSortKey>("student");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedStudents = useMemo(() => {
    const mult = sortDir === "asc" ? 1 : -1;
    return [...students].sort((a, b) => {
      if (sortKey === "totals") {
        const va = a.overdue * 1000 + a.paid;
        const vb = b.overdue * 1000 + b.paid;
        return (va - vb) * mult;
      }
      return a.studentName.localeCompare(b.studentName, undefined, { sensitivity: "base" }) * mult;
    });
  }, [students, sortKey, sortDir]);

  const onToggleSort = useCallback(
    (columnId: string) => {
      const id = columnId as CollectionsMatrixSortKey;
      if (sortKey !== id) {
        setSortKey(id);
        setSortDir("asc");
        return;
      }
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    },
    [sortKey],
  );

  return { sortKey, sortDir, sortedStudents, onToggleSort };
}
