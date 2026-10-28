"use client";

import { useState } from "react";
import type { Dictionary } from "@/types/i18n";
import type { AdminUsersListRoleCounts } from "@/lib/dashboard/loadAdminUsersListRoleCounts";
import type { AppSurface } from "@/hooks/useAppSurface";
import { academicFieldSortKey } from "@/lib/academic-profile/academicDirectorySort";
import type { AdminDirectorySortKey, AdminUsersSortCriterion } from "@/lib/dashboard/adminUsersSortCriteria";
import type { AdminUserRow, SortDir } from "@/lib/dashboard/adminUsersTableHelpers";
import { useAdminUsersTable } from "@/hooks/useAdminUsersTable";
import { useRouter } from "next/navigation";
import { AdminUsersPwaList } from "@/components/pwa/molecules/AdminUsersPwaList";
import { AdminUsersMobileToolbar } from "@/components/pwa/molecules/AdminUsersMobileToolbar";
import { DeleteUsersConfirmModal } from "@/components/dashboard/DeleteUsersConfirmModal";
import { InfoNoticeModal } from "@/components/molecules/InfoNoticeModal";
import { AdminUsersExportModal } from "@/components/molecules/AdminUsersExportModal";
import type {
  AcademicDirectoryChrome,
  AdminDirectoryFiltersChrome,
  AdminParentsDirectoryChrome,
} from "@/components/organisms/AdminUsersScreen";
import {
  bindDirectoryFilterChange,
  bindDirectoryFilterClear,
  parentComposeFilterQuery,
} from "@/lib/dashboard/adminDirectoryToolbarBind";

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
  sortKey: AdminDirectorySortKey;
  sortDir: SortDir;
  sortCriteria?: AdminUsersSortCriterion[];
  locale: string;
  currentUserId: string;
  labels: UserLabels;
  tableLabels: TableLabels;
  surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">;
  lockRole?: string;
  parentsDirectory?: AdminParentsDirectoryChrome;
  directoryFilters?: AdminDirectoryFiltersChrome;
  academicDirectory?: AcademicDirectoryChrome;
}

export function AdminUsersScreenNarrow({
  rows,
  totalCount,
  page,
  pageSize,
  searchQuery,
  roleFilter,
  sortKey,
  sortDir,
  sortCriteria,
  locale,
  currentUserId,
  labels,
  tableLabels,
  surface,
  lockRole,
  parentsDirectory,
  directoryFilters,
  academicDirectory,
}: AdminUsersScreenNarrowProps) {
  void surface;
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
    sortCriteria,
    locale,
    currentUserId,
    labels,
  });

  return (
    <div className="mx-auto max-w-[var(--layout-max-width)] space-y-3">
          <AdminUsersPwaList
            locale={locale}
            listPending={u.isPending}
            toolbar={
              <AdminUsersMobileToolbar
                labels={labels}
                query={u.query}
                onQueryChange={u.setQuery}
                totalCount={totalCount}
                sortKey={u.sortKey}
                sortDir={u.sortDir}
                onToggleSort={u.toggleSort}
                sortCriteria={u.sortCriteria}
                sortFieldLabels={Object.fromEntries(
                  (academicDirectory?.columns ?? []).map((column) => [academicFieldSortKey(column.id), column.label]),
                )}
                onSortCriteriaChange={u.setSortCriteria}
                lockRole={lockRole}
                allVisibleSelected={u.allVisibleSelected}
                onToggleSelectAllVisible={u.toggleSelectAllVisible}
                selectAllDisabled={u.selectAllFilteredDisabled}
                onExportUsers={() => setExportOpen(true)}
                directoryFilters={
                  directoryFilters
                    ? {
                        role: directoryFilters.role,
                        labels: directoryFilters.labels,
                        values: directoryFilters.values,
                        facets: directoryFilters.facets,
                        sectionOptions: directoryFilters.sectionOptions,
                        academicFields: academicDirectory
                          ? {
                              columns: academicDirectory.columns,
                              selectFacets: academicDirectory.selectFacets,
                              labels: labels.academicFields,
                            }
                          : undefined,
                        onChange: bindDirectoryFilterChange(u.replaceParams),
                        onClear: bindDirectoryFilterClear(u.replaceParams),
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
            academicColumns={academicDirectory?.columns ?? []}
            onDeleteSelected={u.onDeleteSelected}
            deleteDisabled={u.deleteDisabled}
            onBulkMail={
              parentsDirectory
                ? () => {
                    const ids = u.selectedIdsList;
                    const qs = ids.length
                      ? `ids=${ids.join(",")}`
                      : parentComposeFilterQuery(u.query, directoryFilters?.values ?? {});
                    router.push(`/${locale}/dashboard/admin/parents/compose?${qs}`);
                  }
                : undefined
            }
            bulkMailLabel={parentsDirectory?.labels.compose}
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
  );
}
