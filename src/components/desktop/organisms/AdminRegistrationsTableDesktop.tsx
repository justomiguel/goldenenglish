"use client";

import { Fragment } from "react";
import { AdminRegistrationAcceptModal } from "@/components/dashboard/AdminRegistrationAcceptModal";
import { AdminRegistrationDeleteModal } from "@/components/dashboard/AdminRegistrationDeleteModal";
import { AdminRegistrationEditModal } from "@/components/dashboard/AdminRegistrationEditModal";
import { AdminRegistrationExpandedDetails } from "@/components/dashboard/AdminRegistrationExpandedDetails";
import { AdminRegistrationTableRow } from "@/components/dashboard/AdminRegistrationTableRow";
import { RegistrationListToolbar } from "@/components/molecules/RegistrationListToolbar";
import { UniversalListView } from "@/components/organisms/UniversalListView";
import { useAdminRegistrationsList } from "@/hooks/useAdminRegistrationsList";
import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";
import { resolveRegistrationContact } from "@/lib/register/resolveRegistrationContact";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import type { AdminRegistrationsTableDesktopProps } from "./AdminRegistrationsTableDesktop.types";

export type {
  AdminRegistrationsTableDesktopProps,
  RegistrationStatusCounts,
} from "./AdminRegistrationsTableDesktop.types";

export function AdminRegistrationsTableDesktop({
  locale,
  rows,
  totalCount,
  page,
  pageSize,
  searchQuery,
  sortKey,
  sortDir,
  statusFilter,
  statusCounts,
  legalAgeMajority,
  instituteName,
  instituteCountry,
  labels,
  tableLabels,
  userLabels,
  currentCohortSections,
  currentCohortName,
}: AdminRegistrationsTableDesktopProps) {
  const u = useAdminRegistrationsList({
    locale,
    rows,
    totalCount,
    page,
    pageSize,
    searchQuery,
    sortKey,
    sortDir,
    statusFilter,
    labels,
  });
  const hdr =
    "px-3 py-2 text-xs uppercase text-[var(--color-muted-foreground)]";
  const sectionNameById = new Map((currentCohortSections ?? []).map((s) => [s.id, s.name]));
  const COLUMN_COUNT = 9;

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

      <div data-tour={ADMIN_TOUR_ANCHORS.registrationsTable}>
      <UniversalListView
        toolbar={
          <RegistrationListToolbar
            labels={labels}
            query={u.filterQuery}
            onQueryChange={u.setFilterQueryAndResetPage}
            totalCount={totalCount}
            filteredCount={totalCount}
            statusFilter={statusFilter}
            statusCounts={statusCounts}
            onStatusFilterChange={u.setStatusFilter}
            locale={locale}
          />
        }
        leadingHeader={<th scope="col" className="w-10 px-2 py-2" aria-hidden />}
        columns={[
          { id: "name", label: labels.name, thClassName: hdr },
          { id: "dni", label: labels.dni, thClassName: hdr },
          // Phones live on the row but have no server sort, so the header stays inert.
          { id: "phoneStudent", label: labels.phoneStudent, thClassName: hdr, sortable: false },
          { id: "phoneTutor", label: labels.phoneTutor, thClassName: hdr, sortable: false },
          { id: "level", label: labels.level, thClassName: hdr },
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
                pageSize: u.pageSize,
                totalCount: u.totalCount,
                onPageChange: u.setPage,
                labels: {
                  prev: tableLabels.paginationPrev,
                  next: tableLabels.paginationNext,
                  summary: tableLabels.paginationSummary,
                  tipPrev: tableLabels.paginationTipPrev,
                  tipNext: tableLabels.paginationTipNext,
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
            <col style={{ width: "4%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
          </colgroup>
        }
      >
        {u.pageRows.map((r) => {
          const contact = resolveRegistrationContact(r, {
            legalAgeMajority,
            country: instituteCountry,
          });
          return (
            <Fragment key={r.id}>
              <AdminRegistrationTableRow
                locale={locale}
                r={r}
                busy={u.busyId === r.id}
                labels={labels}
                statusLabel={u.statusLabel}
                contact={contact}
                instituteName={instituteName}
                expanded={u.expandedId === r.id}
                onToggleExpanded={u.toggleExpanded}
                onAccept={u.setAcceptRow}
                onEdit={u.setEditRow}
                onDelete={u.setDeleteRow}
                onMarkContacted={u.onMarkContacted}
                onRevertToNew={u.onRevertToNew}
              />
              {u.expandedId === r.id ? (
                <AdminRegistrationExpandedDetails
                  row={r}
                  colSpan={COLUMN_COUNT}
                  locale={locale}
                  labels={labels}
                  sectionName={
                    r.preferred_section_id
                      ? (sectionNameById.get(r.preferred_section_id) ?? null)
                      : null
                  }
                  requestedSectionNames={requestedRegistrationSectionIds(r).map(
                    (id) => sectionNameById.get(id) ?? id,
                  )}
                />
              ) : null}
            </Fragment>
          );
        })}
      </UniversalListView>

      <AdminRegistrationDeleteModal
        row={u.deleteRow}
        busy={u.busyId !== null}
        onClose={() => u.setDeleteRow(null)}
        onConfirm={u.onConfirmDelete}
        labels={labels}
      />
      </div>

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
