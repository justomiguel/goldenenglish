"use client";

import { AdminRegistrationAcceptModal } from "@/components/dashboard/AdminRegistrationAcceptModal";
import { AdminRegistrationDeleteModal } from "@/components/dashboard/AdminRegistrationDeleteModal";
import { RegistrationListToolbar } from "@/components/molecules/RegistrationListToolbar";
import { AdminRegistrationsPwaList } from "@/components/pwa/molecules/AdminRegistrationsPwaList";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { useAdminRegistrationsList } from "@/hooks/useAdminRegistrationsList";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { RegistrationSortKey } from "@/lib/dashboard/adminRegistrationsSort";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";

type RegLabels = Dictionary["admin"]["registrations"];
type TableLabels = Dictionary["admin"]["table"];

interface AdminRegistrationsScreenNarrowProps {
  locale: string;
  rows: AdminRegistrationRow[];
  labels: RegLabels;
  tableLabels: TableLabels;
  userLabels: Pick<Dictionary["admin"]["users"], "password" | "passwordHint">;
  surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">;
}

export function AdminRegistrationsScreenNarrow({
  locale,
  rows,
  labels,
  tableLabels,
  userLabels,
  surface,
}: AdminRegistrationsScreenNarrowProps) {
  const u = useAdminRegistrationsList({ locale, rows, labels });

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
                totalCount={u.rows.length}
                filteredCount={u.filtered.length}
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
            onDelete={u.setDeleteRow}
            emptyMessage={u.emptyMessage}
            pagination={{
              page: u.page,
              pageSize: DEFAULT_TABLE_PAGE_SIZE,
              totalCount: u.sorted.length,
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
            busy={u.busyId !== null}
            onBusy={u.setBusyId}
            onClose={() => u.setAcceptRow(null)}
            onSuccess={() => {
              u.setToast(labels.acceptSuccess);
              u.refreshList();
            }}
            labels={labels}
            userLabels={userLabels}
          />
        </div>
      </div>
    </PwaPageShell>
  );
}
