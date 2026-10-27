"use client";

import type { ReactNode } from "react";
import type { Dictionary } from "@/types/i18n";
import type { AdminDirectorySortKey } from "@/lib/dashboard/adminUsersSortCriteria";
import {
  isAdminParentsDirectory,
  isAdminStudentsDirectory,
  isAdminTeachersDirectory,
  type AdminUserRow,
  type SortDir,
} from "@/lib/dashboard/adminUsersTableHelpers";
import { AdminUsersPwaListItem } from "@/components/pwa/molecules/AdminUsersPwaListItem";
import { DirectoryBillingLegend } from "@/components/molecules/DirectoryBillingLegend";
import { AdminUsersBulkBarMobile } from "@/components/pwa/molecules/AdminUsersBulkBarMobile";
import { TablePagination } from "@/components/molecules/TablePagination";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

type UserLabels = Dictionary["admin"]["users"];
type TableLabels = Dictionary["admin"]["table"];

export interface AdminUsersPwaListProps {
  locale: string;
  toolbar: ReactNode;
  labels: UserLabels;
  tableLabels: TableLabels;
  listEmpty: boolean;
  rows: AdminUserRow[];
  currentUserId: string;
  sortKey: AdminDirectorySortKey;
  sortDir: SortDir;
  onToggleSort: (key: AdminDirectorySortKey) => void;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  allVisibleSelected: boolean;
  onToggleSelectAllVisible: () => void;
  deletableVisibleCount: number;
  busy: boolean;
  onRequestDeleteOne: (id: string) => void;
  emptyMessage: string;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
  };
  listPending?: boolean;
  lockRole?: string;
  academicColumns?: { id: string; label: string }[];
  onDeleteSelected?: () => void;
  deleteDisabled?: boolean;
  onBulkMail?: () => void;
  bulkMailLabel?: string;
}

export function AdminUsersPwaList({
  locale,
  toolbar,
  labels,
  tableLabels,
  listEmpty,
  rows,
  currentUserId,
  selectedIds,
  onToggleRow,
  busy,
  onRequestDeleteOne,
  emptyMessage,
  pagination,
  listPending = false,
  lockRole,
  academicColumns = [],
  onDeleteSelected,
  deleteDisabled = false,
  onBulkMail,
  bulkMailLabel,
}: AdminUsersPwaListProps) {
  const studentsDirectory = isAdminStudentsDirectory(lockRole);
  const teachersDirectory = isAdminTeachersDirectory(lockRole);
  const parentsDirectory = isAdminParentsDirectory(lockRole);
  const emptyValue = "—";

  if (listEmpty) {
    return (
      <div className="space-y-4">
        {toolbar}
        <p className="text-sm text-[var(--color-muted-foreground)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {toolbar}
      {studentsDirectory || parentsDirectory ? <DirectoryBillingLegend labels={labels} /> : null}
      {listPending ? (
        <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
          {labels.listUpdating}
        </p>
      ) : null}
      <ul className="space-y-3" aria-busy={listPending || undefined} data-tour={ADMIN_TOUR_ANCHORS.usersTable}>
        {rows.map((r) => (
          <AdminUsersPwaListItem
            key={r.id}
            locale={locale}
            labels={labels}
            row={r}
            currentUserId={currentUserId}
            selected={selectedIds.has(r.id)}
            busy={busy}
            studentsDirectory={studentsDirectory}
            academicColumns={academicColumns}
            teachersDirectory={teachersDirectory}
            parentsDirectory={parentsDirectory}
            emptyValue={emptyValue}
            onToggleRow={onToggleRow}
            onRequestDeleteOne={onRequestDeleteOne}
          />
        ))}
      </ul>

      <div className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)]">
        <TablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalCount={pagination.totalCount}
          onPageChange={pagination.onPageChange}
          labels={{
            prev: tableLabels.paginationPrev,
            next: tableLabels.paginationNext,
            summary: tableLabels.paginationSummary,
            tipPrev: tableLabels.paginationTipPrev,
            tipNext: tableLabels.paginationTipNext,
          }}
        />
      </div>
      {onDeleteSelected ? (
        <AdminUsersBulkBarMobile
          labels={labels}
          selectedCount={selectedIds.size}
          onDeleteSelected={onDeleteSelected}
          deleteDisabled={deleteDisabled}
          onBulkMail={onBulkMail}
          bulkMailLabel={bulkMailLabel}
        />
      ) : null}
    </div>
  );
}
