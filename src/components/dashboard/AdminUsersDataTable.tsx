"use client";

import type { ReactNode, RefObject } from "react";
import type { Dictionary } from "@/types/i18n";
import {
  isAdminParentsDirectory,
  isAdminStudentsDirectory,
  isAdminTeachersDirectory,
  type AdminUserRow,
  type SortKey,
  type SortDir,
} from "@/lib/dashboard/adminUsersTableHelpers";
import { AdminUsersDataTableRow } from "@/components/dashboard/AdminUsersDataTableRow";
import { UniversalListView } from "@/components/organisms/UniversalListView";

type UserLabels = Dictionary["admin"]["users"];
type TableLabels = Dictionary["admin"]["table"];

export interface AdminUsersDataTableProps {
  toolbar: ReactNode;
  locale: string;
  labels: UserLabels;
  tableLabels: TableLabels;
  rows: AdminUserRow[];
  currentUserId: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  selectAllRef: RefObject<HTMLInputElement | null>;
  allVisibleSelected: boolean;
  onToggleSelectAllVisible: () => void;
  deletableVisibleCount: number;
  busy: boolean;
  onRequestDeleteOne: (id: string) => void;
  emptyMessage: string;
  /** True when the full filtered list is empty (not only the current page). */
  listEmpty: boolean;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
  };
  lockRole?: string;
}

export function AdminUsersDataTable({
  toolbar,
  locale,
  labels,
  tableLabels,
  rows,
  currentUserId,
  sortKey,
  sortDir,
  onToggleSort,
  selectedIds,
  onToggleRow,
  selectAllRef,
  allVisibleSelected,
  onToggleSelectAllVisible,
  deletableVisibleCount,
  busy,
  onRequestDeleteOne,
  emptyMessage,
  listEmpty,
  pagination,
  lockRole,
}: AdminUsersDataTableProps) {
  const studentsDirectory = isAdminStudentsDirectory(lockRole);
  const teachersDirectory = isAdminTeachersDirectory(lockRole);
  const parentsDirectory = isAdminParentsDirectory(lockRole);
  const emptyValue = "—";
  const colHead = "min-w-0 px-2 py-3 align-top";
  const columns = studentsDirectory
    ? [
        { id: "name", label: labels.colName, thClassName: colHead },
        { id: "sections", label: labels.colSections, sortable: false, thClassName: colHead },
        { id: "monthlyDue", label: labels.colMonthlyDue, sortable: false, thClassName: colHead },
        { id: "parent", label: labels.colParent, sortable: false, thClassName: colHead },
      ]
    : parentsDirectory
      ? [
          { id: "name", label: labels.colName, thClassName: colHead },
          { id: "email", label: labels.colEmail, thClassName: colHead },
          { id: "children", label: labels.colChildren, sortable: false, thClassName: colHead },
          { id: "sections", label: labels.colSections, sortable: false, thClassName: colHead },
          { id: "lastAccess", label: labels.colLastAccess, thClassName: colHead },
        ]
    : teachersDirectory
      ? [
          { id: "email", label: labels.colEmail, thClassName: colHead },
          { id: "name", label: labels.colName, thClassName: colHead },
          { id: "sections", label: labels.colSections, sortable: false, thClassName: colHead },
          { id: "phone", label: labels.colPhone, thClassName: colHead },
        ]
      : [
          { id: "email", label: labels.colEmail, thClassName: colHead },
          { id: "name", label: labels.colName, thClassName: colHead },
          { id: "role", label: labels.colRole, thClassName: colHead },
          { id: "phone", label: labels.colPhone, thClassName: colHead },
        ];
  return (
    <UniversalListView
      toolbar={toolbar}
      columns={columns}
      sortKey={sortKey}
      sortDir={sortDir}
      onToggleSort={(id) => onToggleSort(id as SortKey)}
      sortLabels={{
        sortAsc: tableLabels.sortAsc,
        sortDesc: tableLabels.sortDesc,
        sortNeutral: tableLabels.sortNeutral,
      }}
      leadingHeader={
        <th scope="col" className="w-10 min-w-0 px-2 py-3">
          <input
            ref={selectAllRef}
            type="checkbox"
            className="h-4 w-4 rounded border-[var(--color-border)]"
            checked={allVisibleSelected}
            onChange={onToggleSelectAllVisible}
            disabled={deletableVisibleCount === 0}
            aria-label={labels.selectAllVisible}
            title={labels.tipSelectAllVisible}
          />
        </th>
      }
      trailingHeader={
        <th
          scope="col"
          className="min-w-0 whitespace-nowrap px-2 py-3 font-semibold text-[var(--color-muted-foreground)]"
        >
          {labels.colActions}
        </th>
      }
      pagination={{
        ...pagination,
        labels: {
          prev: tableLabels.paginationPrev,
          next: tableLabels.paginationNext,
          summary: tableLabels.paginationSummary,
          tipPrev: tableLabels.paginationTipPrev,
          tipNext: tableLabels.paginationTipNext,
        },
      }}
      emptyMessage={emptyMessage}
      isEmpty={listEmpty}
      minTableWidth="min-w-0"
      tableClassName="table-fixed"
      tableOverflow="hidden"
    >
      {rows.map((r) => (
        <AdminUsersDataTableRow
          key={r.id}
          locale={locale}
          labels={labels}
          row={r}
          currentUserId={currentUserId}
          selected={selectedIds.has(r.id)}
          busy={busy}
          studentsDirectory={studentsDirectory}
          teachersDirectory={teachersDirectory}
          parentsDirectory={parentsDirectory}
          emptyValue={emptyValue}
          onToggleRow={onToggleRow}
          onRequestDeleteOne={onRequestDeleteOne}
        />
      ))}
    </UniversalListView>
  );
}
