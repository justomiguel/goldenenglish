"use client";

import { AdminRegistrationAcceptModal } from "@/components/dashboard/AdminRegistrationAcceptModal";
import type { RegistrationAcceptUserLabels } from "@/components/dashboard/AdminRegistrationAcceptForm";
import { AdminRegistrationDeleteModal } from "@/components/dashboard/AdminRegistrationDeleteModal";
import { AdminRegistrationEditModal } from "@/components/dashboard/AdminRegistrationEditModal";
import { AdminRegistrationTableRow } from "@/components/dashboard/AdminRegistrationTableRow";
import { RegistrationListToolbar } from "@/components/molecules/RegistrationListToolbar";
import { UniversalListView } from "@/components/organisms/UniversalListView";
import { useAdminRegistrationsList } from "@/hooks/useAdminRegistrationsList";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/dashboard/tableConstants";

type RegLabels = Dictionary["admin"]["registrations"];
type TableLabels = Dictionary["admin"]["table"];

interface AdminRegistrationsTableDesktopProps {
  locale: string;
  rows: AdminRegistrationRow[];
  legalAgeMajority: number;
  labels: RegLabels;
  tableLabels: TableLabels;
  userLabels: RegistrationAcceptUserLabels;
  currentCohortSections?: CurrentCohortSection[];
  currentCohortName?: string;
}

export function AdminRegistrationsTableDesktop({
  locale,
  rows,
  legalAgeMajority,
  labels,
  tableLabels,
  userLabels,
  currentCohortSections,
  currentCohortName,
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
            thClassName: `${hdr} min-w-0`,
          },
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
            className="min-w-0 px-3 py-2 text-left font-semibold text-[var(--color-secondary)]"
          >
            <span className="break-words">{labels.actions}</span>
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
        minTableWidth="w-full max-w-full"
        tableClassName="table-fixed"
        tableOverflow="hidden"
        colgroup={
          <colgroup>
            <col style={{ width: "15%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "16%" }} />
          </colgroup>
        }
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
            onEdit={u.setEditRow}
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
  );
}
