"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import type { UniversalListSortLabels, UniversalSortDir } from "@/types/universalListView";

export interface SortableColumnHeaderProps {
  columnId: string;
  label: string;
  sortKey: string;
  sortDir: UniversalSortDir;
  onToggleSort: (columnId: string) => void;
  sortLabels: UniversalListSortLabels;
  sortable?: boolean;
}

export function SortableColumnHeader({
  columnId,
  label,
  sortKey,
  sortDir,
  onToggleSort,
  sortLabels,
  sortable = true,
}: SortableColumnHeaderProps) {
  const active = sortKey === columnId;
  const sortHint = active
    ? sortDir === "asc"
      ? sortLabels.sortAsc
      : sortLabels.sortDesc
    : sortLabels.sortNeutral;

  if (!sortable) {
    return (
      <span className="font-semibold text-[var(--color-secondary)]">{label}</span>
    );
  }

  return (
    <button
      type="button"
      className="flex min-h-[44px] w-full items-center justify-start gap-1.5 font-semibold text-[var(--color-secondary)] hover:underline"
      onClick={() => onToggleSort(columnId)}
    >
      <span>{label}</span>
      {active ? (
        sortDir === "asc" ? (
          <ArrowUp className="h-4 w-4 shrink-0 text-[var(--color-secondary)]" aria-hidden />
        ) : (
          <ArrowDown className="h-4 w-4 shrink-0 text-[var(--color-secondary)]" aria-hidden />
        )
      ) : (
        <span className="inline-block w-4 shrink-0" aria-hidden />
      )}
      <span className="sr-only">{sortHint}</span>
    </button>
  );
}
