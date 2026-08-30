"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { AdminRegistrationPwaCard } from "@/components/pwa/molecules/AdminRegistrationPwaCard";
import { TablePagination } from "@/components/molecules/TablePagination";
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

const SORT_KEYS: RegistrationSortKey[] = [
  "name",
  "dni",
  "email",
  "phoneStudent",
  "phoneTutor",
  "level",
  "birth",
  "status",
  "received",
];

function colLabel(labels: RegLabels, key: RegistrationSortKey): string {
  switch (key) {
    case "name":
      return labels.name;
    case "dni":
      return labels.dni;
    case "email":
      return labels.email;
    case "phoneStudent":
      return labels.phoneStudent;
    case "phoneTutor":
      return labels.phoneTutor;
    case "level":
      return labels.level;
    case "birth":
      return labels.birthDate;
    case "status":
      return labels.status;
    case "received":
      return labels.received;
    default:
      return key;
  }
}

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
  currentCohortSections,
  onBusy,
  onIntakeDone,
  emptyMessage,
  pagination,
}: AdminRegistrationsPwaListProps) {
  const sortHint = (key: RegistrationSortKey) => {
    if (sortKey !== key) return tableLabels.sortNeutral;
    return sortDir === "asc" ? tableLabels.sortAsc : tableLabels.sortDesc;
  };

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
      <div className="flex flex-wrap gap-2" role="group">
        {SORT_KEYS.map((key) => {
          const active = sortKey === key;
          return (
            <button
              key={key}
              type="button"
              className={`flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-xl border px-3 text-left text-sm font-medium active:bg-[var(--color-muted)] ${
                active
                  ? "border-[var(--color-primary)]/25 bg-[color-mix(in_srgb,var(--color-primary)_8%,white)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]"
              }`}
              onClick={() => onToggleSort(key)}
              aria-pressed={active}
              title={sortHint(key)}
            >
              <span>{colLabel(labels, key)}</span>
              {active ? (
                sortDir === "asc" ? (
                  <ArrowUp className="h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <ArrowDown className="h-4 w-4 shrink-0" aria-hidden />
                )
              ) : (
                <span className="inline-block w-4 shrink-0" aria-hidden />
              )}
              <span className="sr-only">{sortHint(key)}</span>
            </button>
          );
        })}
      </div>

      <ul className="space-y-2">
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
