"use client";

import type { Dictionary } from "@/types/i18n";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { AdminUserRow } from "@/lib/dashboard/adminUsersTableHelpers";
import { useAdminUsersTable } from "@/hooks/useAdminUsersTable";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { AdminUsersToolbar } from "@/components/dashboard/AdminUsersToolbar";
import { AdminUsersPwaList } from "@/components/pwa/molecules/AdminUsersPwaList";
import { DeleteUsersConfirmModal } from "@/components/dashboard/DeleteUsersConfirmModal";

type UserLabels = Dictionary["admin"]["users"];
type TableLabels = Dictionary["admin"]["table"];

interface AdminUsersScreenNarrowProps {
  rows: AdminUserRow[];
  locale: string;
  currentUserId: string;
  labels: UserLabels;
  tableLabels: TableLabels;
  surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">;
}

export function AdminUsersScreenNarrow({
  rows,
  locale,
  currentUserId,
  labels,
  tableLabels,
  surface,
}: AdminUsersScreenNarrowProps) {
  const u = useAdminUsersTable({ rows, locale, currentUserId, labels });

  return (
    <PwaPageShell surface={surface}>
      <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="mx-auto max-w-[var(--layout-max-width)] space-y-4 py-2">
          <AdminUsersPwaList
            toolbar={
              <AdminUsersToolbar
                labels={labels}
                query={u.query}
                onQueryChange={u.setQuery}
                roleFilter={u.roleFilter}
                onRoleFilterChange={u.setRoleFilter}
                totalCount={rows.length}
                filteredCount={u.filtered.length}
                selectedCount={u.selectedDeletable.length}
                onDeleteSelected={u.onDeleteSelected}
                onDeleteAllVisible={u.onDeleteAllVisible}
                deleteDisabled={u.deleteDisabled}
                deleteAllVisibleDisabled={u.deleteAllVisibleDisabled}
              />
            }
            labels={labels}
            tableLabels={tableLabels}
            listEmpty={u.sorted.length === 0}
            rows={u.pageRows}
            currentUserId={currentUserId}
            sortKey={u.sortKey}
            sortDir={u.sortDir}
            onToggleSort={u.toggleSort}
            selectedIds={u.selectedIds}
            onToggleRow={u.toggleRow}
            allVisibleSelected={u.allVisibleSelected}
            onToggleSelectAllVisible={u.toggleSelectAllVisible}
            deletableVisibleCount={u.deletableVisible.length}
            busy={u.busy}
            onRequestDeleteOne={(id) => u.setConfirmIds([id])}
            emptyMessage={u.emptyMessage}
            pagination={{
              page: u.page,
              pageSize: u.pageSize,
              totalCount: u.sorted.length,
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
      </div>
    </PwaPageShell>
  );
}
