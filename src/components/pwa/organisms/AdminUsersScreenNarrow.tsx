"use client";

import { useState } from "react";
import type { Dictionary } from "@/types/i18n";
import type { AdminUsersListRoleCounts } from "@/lib/dashboard/loadAdminUsersListRoleCounts";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { AdminUserRow, SortKey, SortDir } from "@/lib/dashboard/adminUsersTableHelpers";
import { useAdminUsersTable } from "@/hooks/useAdminUsersTable";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { AdminUsersToolbar } from "@/components/dashboard/AdminUsersToolbar";
import { AdminUsersPwaList } from "@/components/pwa/molecules/AdminUsersPwaList";
import { DeleteUsersConfirmModal } from "@/components/dashboard/DeleteUsersConfirmModal";
import { InfoNoticeModal } from "@/components/molecules/InfoNoticeModal";
import { AdminUsersExportModal } from "@/components/molecules/AdminUsersExportModal";
import type {
  AdminDirectoryFiltersChrome,
  AdminParentsDirectoryChrome,
} from "@/components/organisms/AdminUsersScreen";
import {
  bindDirectoryFilterChange,
  bindDirectoryFilterClear,
  parentComposeFilterQuery,
} from "@/lib/dashboard/adminDirectoryToolbarBind";
import { useRouter } from "next/navigation";

type UserLabels = Dictionary["admin"]["users"];
type TableLabels = Dictionary["admin"]["table"];

interface AdminUsersScreenNarrowProps {
  rows: AdminUserRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  roleFilter: string;
  roleCounts: AdminUsersListRoleCounts;
  sortKey: SortKey;
  sortDir: SortDir;
  locale: string;
  currentUserId: string;
  labels: UserLabels;
  tableLabels: TableLabels;
  surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">;
  lockRole?: string;
  parentsDirectory?: AdminParentsDirectoryChrome;
  directoryFilters?: AdminDirectoryFiltersChrome;
}

export function AdminUsersScreenNarrow({
  rows,
  totalCount,
  page,
  pageSize,
  searchQuery,
  roleFilter,
  roleCounts,
  sortKey,
  sortDir,
  locale,
  currentUserId,
  labels,
  tableLabels,
  surface,
  lockRole,
  parentsDirectory,
  directoryFilters,
}: AdminUsersScreenNarrowProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const router = useRouter();
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
    <PwaPageShell surface={surface}>
      <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="mx-auto max-w-[var(--layout-max-width)] space-y-4 py-2">
          <AdminUsersPwaList
            locale={locale}
            toolbar={
              <AdminUsersToolbar
                labels={labels}
                query={u.query}
                onQueryChange={u.setQuery}
                roleCounts={roleCounts}
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
                onExportUsers={() => setExportOpen(true)}
                lockRole={lockRole}
                directoryFilters={
                  directoryFilters
                    ? {
                        ...directoryFilters,
                        onChange: bindDirectoryFilterChange(u.replaceParams),
                        onClear: bindDirectoryFilterClear(u.replaceParams),
                      }
                    : undefined
                }
                parentsChrome={
                  parentsDirectory
                    ? {
                        labels: parentsDirectory.labels,
                        onInvite: () => {
                          void parentsDirectory.onInvite(u.selectedIdsList);
                        },
                        onCompose: () => {
                          const ids = u.selectedIdsList;
                          const qs = ids.length
                            ? `ids=${ids.join(",")}`
                            : parentComposeFilterQuery(u.query, directoryFilters?.values ?? {});
                          router.push(`/${locale}/dashboard/admin/parents/compose?${qs}`);
                        },
                      }
                    : undefined
                }
              />
            }
            labels={labels}
            tableLabels={tableLabels}
            listEmpty={u.listEmpty}
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
              totalCount: u.totalCount,
              onPageChange: u.setPage,
            }}
            lockRole={lockRole}
          />

          <DeleteUsersConfirmModal
            open={u.confirmIds !== null && u.confirmIds.length > 0}
            onOpenChange={(o) => {
              if (!o) u.setConfirmIds(null);
            }}
            title={u.tpl(labels.confirmDeleteTitle, u.deleteModalTitleCount)}
            description={labels.confirmDeleteCascade}
            resolvingNotice={u.deletePreviewBusy ? u.resolvingNoticeLabel : undefined}
            cascadeNotice={u.cascadeNotice}
            previewErrorNotice={u.previewErrorNotice}
            addedStudentsHeading={
              u.addedStudentsPreview.length ? labels.confirmDeleteAddedStudentsHeading : undefined
            }
            addedStudents={u.addedStudentsPreview.length ? u.addedStudentsPreview : undefined}
            body={u.tpl(labels.confirmDeleteIntro, u.deleteModalTitleCount)}
            cancelLabel={labels.cancel}
            confirmLabel={labels.confirmDelete}
            confirmDisabled={u.deletePreviewBusy}
            busy={u.busy}
            onConfirm={() => {
              if (u.effectiveDeleteIdsOnConfirm.length) void u.runDelete(u.effectiveDeleteIdsOnConfirm);
            }}
          />

          <InfoNoticeModal
            open={u.deleteOutcomeMessage !== null}
            onOpenChange={(o) => {
              if (!o) u.clearDeleteOutcomeMessage();
            }}
            title={labels.deleteResultTitle}
            message={u.deleteOutcomeMessage ?? ""}
            closeLabel={labels.deleteResultClose}
          />

          {labels.spreadsheet ? (
            <AdminUsersExportModal
              open={exportOpen}
              onOpenChange={setExportOpen}
              locale={locale}
              labels={labels.spreadsheet}
              selectedIds={[...u.selectedIds]}
              searchQuery={u.query}
              roleFilter={u.roleFilter}
            />
          ) : null}
        </div>
      </div>
    </PwaPageShell>
  );
}
