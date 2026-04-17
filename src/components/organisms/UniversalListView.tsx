"use client";

import type { ReactNode } from "react";
import { SortableColumnHeader } from "@/components/molecules/SortableColumnHeader";
import { TablePagination } from "@/components/molecules/TablePagination";
import type {
  UniversalListSortColumn,
  UniversalListSortLabels,
  UniversalSortDir,
} from "@/types/universalListView";

export interface UniversalListViewProps {
  /** Filters / actions rendered above the table (same block as sort + pagination). */
  toolbar?: ReactNode;
  columns: UniversalListSortColumn[];
  sortKey: string;
  sortDir: UniversalSortDir;
  onToggleSort: (columnId: string) => void;
  sortLabels: UniversalListSortLabels;
  leadingHeader?: ReactNode;
  trailingHeader?: ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    labels: {
      prev: string;
      next: string;
      summary: string;
      tipPrev?: string;
      tipNext?: string;
    };
  };
  emptyMessage: string;
  isEmpty: boolean;
  minTableWidth?: string;
  /** Extra classes on `<table>` (e.g. `table-fixed min-w-0`). */
  tableClassName?: string;
  /** Optional `<colgroup>` for column widths in fixed layout. */
  colgroup?: ReactNode;
  /** `hidden` avoids horizontal scroll when the table fits the container (use with wrapping cells). */
  tableOverflow?: "auto" | "hidden";
  children: ReactNode;
}

export function UniversalListView({
  toolbar,
  columns,
  sortKey,
  sortDir,
  onToggleSort,
  sortLabels,
  leadingHeader,
  trailingHeader,
  pagination,
  emptyMessage,
  isEmpty,
  minTableWidth = "min-w-full",
  tableClassName = "",
  colgroup,
  tableOverflow = "auto",
  children,
}: UniversalListViewProps) {
  const emptyBlock = (
    <p className="text-sm text-[var(--color-muted-foreground)]">{emptyMessage}</p>
  );

  if (isEmpty) {
    if (toolbar) {
      return (
        <div className="space-y-4">
          {toolbar}
          {emptyBlock}
        </div>
      );
    }
    return emptyBlock;
  }

  return (
    <div className="space-y-4">
      {toolbar}
      <div
        className={`rounded-[var(--layout-border-radius)] border border-[var(--color-border)] ${
          tableOverflow === "hidden" ? "overflow-x-hidden" : "overflow-x-auto"
        }`}
      >
        <table
          className={`w-full min-w-0 text-left text-sm ${minTableWidth} ${tableClassName}`.trim()}
        >
          {colgroup}
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]">
            <tr>
              {leadingHeader}
              {columns.map((col) => {
                const sortable = col.sortable !== false;
                const ariaSort =
                  sortKey === col.id && sortable
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none";
                return (
                  <th
                    key={col.id}
                    scope="col"
                    className={`${col.thClassName ?? "px-2 py-3"} ${col.className ?? ""}`}
                    aria-sort={ariaSort}
                  >
                    <SortableColumnHeader
                      columnId={col.id}
                      label={col.label}
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onToggleSort={onToggleSort}
                      sortLabels={sortLabels}
                      sortable={sortable}
                    />
                  </th>
                );
              })}
              {trailingHeader}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
        {pagination ? (
          <TablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalCount={pagination.totalCount}
            onPageChange={pagination.onPageChange}
            labels={pagination.labels}
          />
        ) : null}
      </div>
    </div>
  );
}
