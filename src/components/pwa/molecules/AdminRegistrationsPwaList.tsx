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

type RegLabels = Dictionary["admin"]["registrations"];
type TableLabels = Dictionary["admin"]["table"];

const SORT_KEYS: RegistrationSortKey[] = [
  "name",
  "dni",
  "email",
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
  busyId: string | null;
  onAccept: (row: AdminRegistrationRow) => void;
  onDelete: (row: AdminRegistrationRow) => void;
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
  busyId,
  onAccept,
  onDelete,
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
              className="flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-left text-sm font-medium text-[var(--color-secondary)] active:bg-[var(--color-muted)]"
              onClick={() => onToggleSort(key)}
              aria-pressed={active}
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
            onAccept={onAccept}
            onDelete={onDelete}
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
          }}
        />
      </div>
    </div>
  );
}
