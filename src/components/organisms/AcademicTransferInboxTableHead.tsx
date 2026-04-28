"use client";

import { SortableColumnHeader } from "@/components/molecules/SortableColumnHeader";
import type { UniversalSortDir } from "@/types/universalListView";
import type { TransferInboxSortKey } from "@/lib/academics/sortAdminTransferInboxRows";
import type { Dictionary } from "@/types/i18n";

type Dict = Dictionary["dashboard"]["academicRequests"];

export interface AcademicTransferInboxTableHeadProps {
  dict: Dict;
  sortKey: TransferInboxSortKey;
  sortDir: UniversalSortDir;
  allSelected: boolean;
  pending: boolean;
  sortedRowsLength: number;
  onToggleSort: (columnId: string) => void;
  onToggleAllVisible: () => void;
}

export function AcademicTransferInboxTableHead({
  dict,
  sortKey,
  sortDir,
  allSelected,
  pending,
  sortedRowsLength,
  onToggleSort,
  onToggleAllVisible,
}: AcademicTransferInboxTableHeadProps) {
  const sortLabels = dict.tableSort;
  return (
    <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40 text-xs uppercase text-[var(--color-muted-foreground)]">
      <tr>
        <th className="px-2 py-2">
          <span className="sr-only">{dict.colSelect}</span>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAllVisible}
            disabled={pending || sortedRowsLength === 0}
            aria-label={dict.selectAll}
            title={dict.tipHeaderCheckbox}
          />
        </th>
        <th className="px-3 py-2" scope="col" aria-sort={sortKey === "student" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
          <SortableColumnHeader
            columnId="student"
            label={dict.colStudent}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={onToggleSort}
            sortLabels={sortLabels}
          />
        </th>
        <th className="px-3 py-2" scope="col" aria-sort={sortKey === "from" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
          <SortableColumnHeader
            columnId="from"
            label={dict.colFrom}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={onToggleSort}
            sortLabels={sortLabels}
          />
        </th>
        <th className="px-3 py-2" scope="col" aria-sort={sortKey === "to" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
          <SortableColumnHeader
            columnId="to"
            label={dict.colTo}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={onToggleSort}
            sortLabels={sortLabels}
          />
        </th>
        <th className="px-3 py-2" scope="col" aria-sort={sortKey === "by" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
          <SortableColumnHeader
            columnId="by"
            label={dict.colBy}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={onToggleSort}
            sortLabels={sortLabels}
          />
        </th>
        <th className="px-3 py-2" scope="col" aria-sort={sortKey === "note" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
          <SortableColumnHeader
            columnId="note"
            label={dict.colNote}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={onToggleSort}
            sortLabels={sortLabels}
          />
        </th>
        <th className="px-3 py-2" scope="col">
          <span className="font-semibold text-[var(--color-secondary)]">{dict.colActions}</span>
        </th>
      </tr>
    </thead>
  );
}
