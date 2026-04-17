"use client";

import { AdminRegistrationAcceptModal } from "@/components/dashboard/AdminRegistrationAcceptModal";
import type { RegistrationAcceptUserLabels } from "@/components/dashboard/AdminRegistrationAcceptForm";
import { AdminRegistrationDeleteModal } from "@/components/dashboard/AdminRegistrationDeleteModal";
import { AdminRegistrationEditModal } from "@/components/dashboard/AdminRegistrationEditModal";
import { RegistrationListToolbar } from "@/components/molecules/RegistrationListToolbar";
import { AdminRegistrationsPwaList } from "@/components/pwa/molecules/AdminRegistrationsPwaList";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { useAdminRegistrationsList } from "@/hooks/useAdminRegistrationsList";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";
import type { RegistrationSortKey, RegistrationSortDir } from "@/lib/dashboard/adminRegistrationsSort";

type RegLabels = Dictionary["admin"]["registrations"];
type TableLabels = Dictionary["admin"]["table"];

interface AdminRegistrationsScreenNarrowProps {
  locale: string;
  rows: AdminRegistrationRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  sortKey: RegistrationSortKey;
  sortDir: RegistrationSortDir;
  legalAgeMajority: number;
  labels: RegLabels;
  tableLabels: TableLabels;
  userLabels: RegistrationAcceptUserLabels;
  surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">;
  currentCohortSections?: CurrentCohortSection[];
  currentCohortName?: string;
}

export function AdminRegistrationsScreenNarrow({
  locale,
  rows,
  totalCount,
  page,
  pageSize,
  searchQuery,
  sortKey,
  sortDir,
  legalAgeMajority,
  labels,
  tableLabels,
  userLabels,
  surface,
  currentCohortSections,
  currentCohortName,
}: AdminRegistrationsScreenNarrowProps) {
  const u = useAdminRegistrationsList({
    locale,
    rows,
    totalCount,
    page,
    pageSize,
    searchQuery,
    sortKey,
    sortDir,
    labels,
  });

  return (
    <PwaPageShell surface={surface}>
      <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="mx-auto max-w-[var(--layout-max-width)] space-y-4 py-2">
          {u.toast ? (
            <p
              className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-4 py-3 text-sm"
              role="status"
            >
              {u.toast}
            </p>
          ) : null}

          <AdminRegistrationsPwaList
            toolbar={
              <RegistrationListToolbar
                labels={labels}
                query={u.filterQuery}
                onQueryChange={u.setFilterQueryAndResetPage}
                totalCount={totalCount}
                filteredCount={totalCount}
              />
            }
            labels={labels}
            tableLabels={tableLabels}
            listEmpty={u.listEmpty}
            rows={u.pageRows}
            locale={locale}
            sortKey={u.sortKey}
            sortDir={u.sortDir}
            onToggleSort={(key: RegistrationSortKey) => u.toggleSort(key)}
            statusLabel={u.statusLabel}
            busyId={u.busyId}
            onAccept={u.setAcceptRow}
            onEdit={u.setEditRow}
            onDelete={u.setDeleteRow}
            emptyMessage={u.emptyMessage}
            pagination={{
              page: u.page,
              pageSize: u.pageSize,
              totalCount: u.totalCount,
              onPageChange: u.setPage,
            }}
          />

          <AdminRegistrationDeleteModal
            row={u.deleteRow}
            busy={u.busyId !== null}
            onClose={() => u.setDeleteRow(null)}
            onConfirm={u.onConfirmDelete}
            labels={labels}
          />

          <AdminRegistrationAcceptModal
            locale={locale}
            row={u.acceptRow}
            legalAgeMajority={legalAgeMajority}
            busy={u.busyId !== null}
            onBusy={u.setBusyId}
            onClose={() => u.setAcceptRow(null)}
            onSuccess={() => {
              u.setToast(labels.acceptSuccess);
              u.refreshList();
            }}
            labels={labels}
            userLabels={userLabels}
            currentCohortSections={currentCohortSections}
            currentCohortName={currentCohortName}
          />

          <AdminRegistrationEditModal
            locale={locale}
            row={u.editRow}
            busy={u.busyId !== null}
            onBusy={u.setBusyId}
            onClose={() => u.setEditRow(null)}
            onSuccess={() => {
              u.setToast(labels.editSuccess);
              u.refreshList();
            }}
            labels={labels}
          />
        </div>
      </div>
    </PwaPageShell>
  );
}
