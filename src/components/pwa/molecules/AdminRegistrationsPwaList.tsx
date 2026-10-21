"use client";

import type { ReactNode } from "react";
import { AdminRegistrationPwaCard } from "@/components/pwa/molecules/AdminRegistrationPwaCard";
import { AdminRegistrationsSortSheet } from "@/components/pwa/molecules/AdminRegistrationsSortSheet";
import { TablePagination } from "@/components/molecules/TablePagination";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type {
  RegistrationSortDir,
  RegistrationSortKey,
} from "@/lib/dashboard/adminRegistrationsSort";
import type { RegistrationContactView } from "@/lib/register/resolveRegistrationContact";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";

type RegLabels = Dictionary["admin"]["registrations"];
type TableLabels = Dictionary["admin"]["table"];

export interface AdminRegistrationsPwaListProps {
  toolbar: ReactNode;
  labels: RegLabels;
  tableLabels: TableLabels;
  listEmpty: boolean;
  rows: AdminRegistrationRow[];
  locale: string;
  sortKey: RegistrationSortKey;
  sortDir: RegistrationSortDir;
  onToggleSort: (key: RegistrationSortKey) => void;
  statusLabel: (status: string) => string;
  contactFor: (row: AdminRegistrationRow) => RegistrationContactView;
  instituteName: string;
  busyId: string | null;
  onAccept: (row: AdminRegistrationRow) => void;
  onEdit: (row: AdminRegistrationRow) => void;
  onDelete: (row: AdminRegistrationRow) => void;
  onMarkContacted: (row: AdminRegistrationRow) => void;
  onRevertToNew: (row: AdminRegistrationRow) => void;
  onStartEnrollmentFee: (row: AdminRegistrationRow) => void;
  onStartJoinCharge: (row: AdminRegistrationRow) => void;
  currentCohortSections?: CurrentCohortSection[];
  onBusy?: (id: string | null) => void;
  onIntakeDone?: () => void;
  emptyMessage: string;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
  };
}

export function AdminRegistrationsPwaList({
  toolbar,
  labels,
  tableLabels,
  listEmpty,
  rows,
  locale,
  sortKey,
  sortDir,
  onToggleSort,
  statusLabel,
  contactFor,
  instituteName,
  busyId,
  onAccept,
  onEdit,
  onDelete,
  onMarkContacted,
  onRevertToNew,
  onStartEnrollmentFee,
  onStartJoinCharge,
  currentCohortSections,
  onBusy,
  onIntakeDone,
  emptyMessage,
  pagination,
}: AdminRegistrationsPwaListProps) {
  if (listEmpty) {
    return (
      <div className="space-y-4">
        {toolbar}
        <p className="text-sm text-[var(--color-muted-foreground)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {toolbar}
      <AdminRegistrationsSortSheet
        labels={labels}
        tableLabels={tableLabels}
        sortKey={sortKey}
        sortDir={sortDir}
        onToggleSort={onToggleSort}
      />
      <ul className="space-y-2" data-tour={ADMIN_TOUR_ANCHORS.registrationsTable}>
        {rows.map((r) => (
          <AdminRegistrationPwaCard
            key={r.id}
            locale={locale}
            r={r}
            busy={busyId === r.id}
            labels={labels}
            statusLabel={statusLabel}
            contact={contactFor(r)}
            instituteName={instituteName}
            onAccept={onAccept}
            onEdit={onEdit}
            onDelete={onDelete}
            onMarkContacted={onMarkContacted}
            onRevertToNew={onRevertToNew}
            onStartEnrollmentFee={onStartEnrollmentFee}
            onStartJoinCharge={onStartJoinCharge}
            currentCohortSections={currentCohortSections}
            onBusy={onBusy}
            onIntakeDone={onIntakeDone}
          />
        ))}
      </ul>

      <div className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)]">
        <TablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalCount={pagination.totalCount}
          onPageChange={pagination.onPageChange}
          labels={{
            prev: tableLabels.paginationPrev,
            next: tableLabels.paginationNext,
            summary: tableLabels.paginationSummary,
            tipPrev: tableLabels.paginationTipPrev,
            tipNext: tableLabels.paginationTipNext,
          }}
        />
      </div>
    </div>
  );
}
