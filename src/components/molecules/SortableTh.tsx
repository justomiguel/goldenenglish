"use client";

import { SortableColumnHeader } from "@/components/molecules/SortableColumnHeader";
import type { UniversalListSortLabels, UniversalSortDir } from "@/types/universalListView";

export function SortableTh({
  columnId,
  label,
  sortKey,
  sortDir,
  onToggleSort,
  sortLabels,
  className,
  sortable = true,
}: {
  columnId: string;
  label: string;
  sortKey: string;
  sortDir: UniversalSortDir;
  onToggleSort: (columnId: string) => void;
  sortLabels: UniversalListSortLabels;
  className?: string;
  sortable?: boolean;
}) {
  const ariaSort =
    sortable && sortKey === columnId
      ? sortDir === "asc"
        ? "ascending"
        : "descending"
      : sortable
        ? "none"
        : undefined;

  return (
    <th scope="col" className={className} aria-sort={ariaSort}>
      <SortableColumnHeader
        columnId={columnId}
        label={label}
        sortKey={sortKey}
        sortDir={sortDir}
        onToggleSort={onToggleSort}
        sortLabels={sortLabels}
        sortable={sortable}
      />
    </th>
  );
}
