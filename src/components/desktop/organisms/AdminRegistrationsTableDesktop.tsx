"use client";

import { AdminRegistrationAcceptModal } from "@/components/dashboard/AdminRegistrationAcceptModal";
import { AdminRegistrationDeleteModal } from "@/components/dashboard/AdminRegistrationDeleteModal";
import { AdminRegistrationTableRow } from "@/components/dashboard/AdminRegistrationTableRow";
import { RegistrationListToolbar } from "@/components/molecules/RegistrationListToolbar";
import { UniversalListView } from "@/components/organisms/UniversalListView";
import { useAdminRegistrationsList } from "@/hooks/useAdminRegistrationsList";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";

type RegLabels = Dictionary["admin"]["registrations"];
type TableLabels = Dictionary["admin"]["table"];

interface AdminRegistrationsTableDesktopProps {
  locale: string;
  rows: AdminRegistrationRow[];
  labels: RegLabels;
  tableLabels: TableLabels;
  userLabels: Pick<Dictionary["admin"]["users"], "password" | "passwordHint">;
}

export function AdminRegistrationsTableDesktop({
  locale,
  rows,
  labels,
  tableLabels,
  userLabels,
}: AdminRegistrationsTableDesktopProps) {
  const u = useAdminRegistrationsList({ locale, rows, labels });
  const hdr =
    "px-3 py-2 text-xs uppercase text-[var(--color-muted-foreground)]";

  return (
    <div className="mt-8 space-y-4">
      {u.toast ? (
        <p
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-4 py-3 text-sm"
          role="status"
        >
          {u.toast}
        </p>
      ) : null}

      <UniversalListView
        toolbar={
          <RegistrationListToolbar
            labels={labels}
            query={u.filterQuery}
            onQueryChange={u.setFilterQueryAndResetPage}
            totalCount={u.rows.length}
            filteredCount={u.filtered.length}
          />
        }
        columns={[
          { id: "name", label: labels.name, thClassName: hdr },
          { id: "dni", label: labels.dni, thClassName: hdr },
          { id: "email", label: labels.email, thClassName: hdr },
          { id: "level", label: labels.level, thClassName: hdr },
          {
            id: "birth",
            label: labels.birthDate,
            thClassName: `${hdr} whitespace-nowrap`,
          },
          { id: "status", label: labels.status, thClassName: hdr },
          { id: "received", label: labels.received, thClassName: hdr },
        ]}
        sortKey={u.sortKey}
        sortDir={u.sortDir}
        onToggleSort={u.toggleSort}
        sortLabels={{
          sortAsc: tableLabels.sortAsc,
          sortDesc: tableLabels.sortDesc,
          sortNeutral: tableLabels.sortNeutral,
        }}
        trailingHeader={
          <th
            scope="col"
            className="min-w-[7.5rem] px-3 py-2 font-semibold text-[var(--color-secondary)]"
          >
            {labels.actions}
          </th>
        }
        pagination={
          u.listEmpty
            ? undefined
            : {
                page: u.page,
                pageSize: DEFAULT_TABLE_PAGE_SIZE,
                totalCount: u.sorted.length,
                onPageChange: u.setPage,
                labels: {
                  prev: tableLabels.paginationPrev,
                  next: tableLabels.paginationNext,
                  summary: tableLabels.paginationSummary,
                },
              }
        }
        emptyMessage={u.emptyMessage}
        isEmpty={u.listEmpty}
        minTableWidth="min-w-full"
      >
        {u.pageRows.map((r) => (
          <AdminRegistrationTableRow
            key={r.id}
            locale={locale}
            r={r}
            busy={u.busyId === r.id}
            labels={labels}
            statusLabel={u.statusLabel}
            onAccept={u.setAcceptRow}
            onDelete={u.setDeleteRow}
          />
        ))}
      </UniversalListView>

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
  );
}
