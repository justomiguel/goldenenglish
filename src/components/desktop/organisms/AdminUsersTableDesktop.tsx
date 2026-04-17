"use client";

import type { Dictionary } from "@/types/i18n";
import type { AdminUserRow, SortKey, SortDir } from "@/lib/dashboard/adminUsersTableHelpers";
import { useAdminUsersTable } from "@/hooks/useAdminUsersTable";
import { AdminUsersToolbar } from "@/components/dashboard/AdminUsersToolbar";
import { AdminUsersDataTable } from "@/components/dashboard/AdminUsersDataTable";
import { DeleteUsersConfirmModal } from "@/components/dashboard/DeleteUsersConfirmModal";

type UserLabels = Dictionary["admin"]["users"];
type TableLabels = Dictionary["admin"]["table"];

interface AdminUsersTableDesktopProps {
  rows: AdminUserRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  roleFilter: string;
  sortKey: SortKey;
  sortDir: SortDir;
  locale: string;
  currentUserId: string;
  labels: UserLabels;
  tableLabels: TableLabels;
}

export function AdminUsersTableDesktop({
  rows,
  totalCount,
  page,
  pageSize,
  searchQuery,
  roleFilter,
  sortKey,
  sortDir,
  locale,
  currentUserId,
  labels,
  tableLabels,
}: AdminUsersTableDesktopProps) {
  const u = useAdminUsersTable({
    rows,
    totalCount,
    page,
    pageSize,
    searchQuery,
    roleFilter,
    sortKey,
    sortDir,
    locale,
    currentUserId,
    labels,
  });

  return (
    <div className="space-y-4">
      <AdminUsersDataTable
        locale={locale}
        toolbar={
          <AdminUsersToolbar
            labels={labels}
            query={u.query}
            onQueryChange={u.setQuery}
            roleFilter={u.roleFilter}
            onRoleFilterChange={u.setRoleFilter}
            totalCount={totalCount}
            filteredCount={totalCount}
            selectedCount={u.selectedDeletable.length}
            onDeleteSelected={u.onDeleteSelected}
            allVisibleSelected={u.allVisibleSelected}
            onToggleSelectAllFiltered={u.toggleSelectAllVisible}
            deleteDisabled={u.deleteDisabled}
            selectAllFilteredDisabled={u.selectAllFilteredDisabled}
          />
        }
        labels={labels}
        tableLabels={tableLabels}
        rows={u.pageRows}
        currentUserId={currentUserId}
        sortKey={u.sortKey}
        sortDir={u.sortDir}
        onToggleSort={u.toggleSort}
        selectedIds={u.selectedIds}
        onToggleRow={u.toggleRow}
        selectAllRef={u.selectAllRef}
        allVisibleSelected={u.allVisibleSelected}
        onToggleSelectAllVisible={u.toggleSelectAllVisible}
        deletableVisibleCount={u.deletableVisible.length}
        busy={u.busy}
        onRequestDeleteOne={(id) => u.setConfirmIds([id])}
        emptyMessage={u.emptyMessage}
        listEmpty={u.listEmpty}
        pagination={{
          page: u.page,
          pageSize: u.pageSize,
          totalCount: u.totalCount,
          onPageChange: u.setPage,
        }}
      />

      <DeleteUsersConfirmModal
        open={u.confirmIds !== null && u.confirmIds.length > 0}
        onOpenChange={(o) => {
          if (!o) u.setConfirmIds(null);
        }}
        title={u.tpl(labels.confirmDeleteTitle, u.confirmIds?.length ?? 0)}
        description={labels.confirmDeleteCascade}
        body={u.tpl(labels.confirmDeleteIntro, u.confirmIds?.length ?? 0)}
        cancelLabel={labels.cancel}
        confirmLabel={labels.confirmDelete}
        busy={u.busy}
        onConfirm={() => {
          if (u.confirmIds?.length) void u.runDelete(u.confirmIds);
        }}
      />
    </div>
  );
}
