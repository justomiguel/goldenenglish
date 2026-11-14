"use client";

import { AdminRegistrationAcceptModal } from "@/components/dashboard/AdminRegistrationAcceptModal";
import type { RegistrationAcceptUserLabels } from "@/components/dashboard/AdminRegistrationAcceptForm";
import { AdminRegistrationDeleteModal } from "@/components/dashboard/AdminRegistrationDeleteModal";
import { AdminRegistrationEditModal } from "@/components/dashboard/AdminRegistrationEditModal";
import { RegistrationListToolbar } from "@/components/molecules/RegistrationListToolbar";
import { AdminRegistrationsPwaList } from "@/components/pwa/molecules/AdminRegistrationsPwaList";
import {
  useAdminRegistrationsList,
  type RegistrationStatusFilter,
} from "@/hooks/useAdminRegistrationsList";
import type { AppSurface } from "@/hooks/useAppSurface";
import { resolveRegistrationContact } from "@/lib/register/resolveRegistrationContact";
import type { CountryCode } from "libphonenumber-js";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";
import type { RegistrationSortKey, RegistrationSortDir } from "@/lib/dashboard/adminRegistrationsSort";
import type { RegistrationInboxFilter } from "@/lib/register/registrationInboxFilter";
import type { RegistrationInboxCounts } from "@/lib/register/countRegistrationInboxFilters";
import type { RegistrationSectionPickerOption } from "@/lib/register/registrationSectionPicker";
import type { RegistrationPageSelection } from "@/hooks/useRegistrationPageSelection";

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
  statusFilter?: RegistrationStatusFilter;
  statusCounts: { total: number; new: number; contacted: number };
  inboxFilter?: RegistrationInboxFilter;
  inboxCounts?: RegistrationInboxCounts;
  legalAgeMajority: number;
  instituteName: string;
  instituteCountry: CountryCode | null;
  labels: RegLabels;
  tableLabels: TableLabels;
  userLabels: RegistrationAcceptUserLabels;
  surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">;
  currentCohortSections?: CurrentCohortSection[];
  sectionOptionsByCohort?: Record<string, RegistrationSectionPickerOption[]>;
  currentCohortName?: string;
  createSectionHref?: string | null;
  usesCefrLevel?: boolean;
  selection?: RegistrationPageSelection;
  selectedCohortId?: string | null;
  cycleStartsOn?: string | null;
  cycleEndsOn?: string | null;
  openCohortId?: string | null;
  cohortHasMatricula?: boolean;
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
  statusFilter,
  statusCounts,
  inboxFilter,
  inboxCounts,
  legalAgeMajority,
  instituteName,
  instituteCountry,
  labels,
  tableLabels,
  userLabels,
  surface,
  currentCohortSections,
  sectionOptionsByCohort,
  currentCohortName,
  createSectionHref,
  usesCefrLevel = false,
  selection,
  selectedCohortId,
  cycleStartsOn,
  cycleEndsOn,
  openCohortId,
  cohortHasMatricula = false,
}: AdminRegistrationsScreenNarrowProps) {
  void surface;
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
    inboxFilter,
    labels,
  });

  return (
    <div className="mx-auto max-w-[var(--layout-max-width)] space-y-3">
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
                statusFilter={statusFilter}
                statusCounts={statusCounts}
                onStatusFilterChange={u.setStatusFilter}
                inboxFilter={inboxFilter}
                inboxCounts={inboxCounts}
                onInboxFilterChange={u.setInboxFilter}
                locale={locale}
                selection={selection}
                selectedCohortId={selectedCohortId}
                openCohortId={openCohortId}
                cohortHasMatricula={cohortHasMatricula}
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
            contactFor={(row) =>
              resolveRegistrationContact(row, { legalAgeMajority, country: instituteCountry })
            }
            instituteName={instituteName}
            busyId={u.busyId}
            onAccept={u.setAcceptRow}
            onEdit={u.setEditRow}
            onDelete={u.setDeleteRow}
            onMarkContacted={u.onMarkContacted}
            onRevertToNew={u.onRevertToNew}
            onStartEnrollmentFee={u.onStartEnrollmentFee}
            onStartJoinCharge={u.onStartJoinCharge}
            currentCohortSections={currentCohortSections}
            sectionOptionsByCohort={sectionOptionsByCohort}
            selectedCohortId={selectedCohortId}
            cycleStartsOn={cycleStartsOn}
            cycleEndsOn={cycleEndsOn}
            createSectionHref={createSectionHref}
            createSectionLabel={labels.createSectionInCohort.replaceAll(
              "{{cohort}}",
              currentCohortName ?? "",
            )}
            onBusy={u.setBusyId}
            onIntakeDone={() => {
              u.setToast(labels.acceptSuccess);
              u.refreshList();
            }}
            selection={selection}
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
            cycleStartsOn={cycleStartsOn}
            cycleEndsOn={cycleEndsOn}
            currentCohortName={currentCohortName}
            createSectionHref={createSectionHref}
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
            usesCefrLevel={usesCefrLevel}
          />
    </div>
  );
}
