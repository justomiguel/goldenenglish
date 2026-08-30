"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import {
  isAdminParentsDirectory,
  isAdminStudentsDirectory,
  isAdminTeachersDirectory,
  type AdminUserRow,
  type SortDir,
  type SortKey,
} from "@/lib/dashboard/adminUsersTableHelpers";
import { AdminUsersPwaListItem } from "@/components/pwa/molecules/AdminUsersPwaListItem";
import { TablePagination } from "@/components/molecules/TablePagination";

type UserLabels = Dictionary["admin"]["users"];
type TableLabels = Dictionary["admin"]["table"];

const DIRECTORY_SORT_KEYS: SortKey[] = ["email", "name", "role", "phone"];
const STUDENT_SORT_KEYS: SortKey[] = [
  "name",
  "sections",
  "monthlyDue",
  "enrollmentFee",
  "lastEnrollment",
  "parent",
];
const TEACHER_SORT_KEYS: SortKey[] = ["email", "name", "sections", "phone"];
const PARENT_SORT_KEYS: SortKey[] = [
  "name",
  "email",
  "children",
  "sections",
  "monthlyDue",
  "enrollmentFee",
  "lastEnrollment",
  "lastAccess",
];

function colLabel(labels: UserLabels, key: SortKey): string {
  switch (key) {
    case "email":
      return labels.colEmail;
    case "name":
      return labels.colName;
    case "role":
      return labels.colRole;
    case "phone":
      return labels.colPhone;
    case "lastAccess":
      return labels.colLastAccess;
    case "sections":
      return labels.colSections;
    case "monthlyDue":
      return labels.colMonthlyDue;
    case "enrollmentFee":
      return labels.colEnrollmentFee;
    case "lastEnrollment":
      return labels.colLastEnrollment;
    case "parent":
      return labels.colParent;
    case "children":
      return labels.colChildren;
    default:
      return key;
  }
}

export interface AdminUsersPwaListProps {
  locale: string;
  toolbar: ReactNode;
  labels: UserLabels;
  tableLabels: TableLabels;
  listEmpty: boolean;
  rows: AdminUserRow[];
  currentUserId: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  allVisibleSelected: boolean;
  onToggleSelectAllVisible: () => void;
  deletableVisibleCount: number;
  busy: boolean;
  onRequestDeleteOne: (id: string) => void;
  emptyMessage: string;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
  };
  lockRole?: string;
}

export function AdminUsersPwaList({
  locale,
  toolbar,
  labels,
  tableLabels,
  listEmpty,
  rows,
  currentUserId,
  sortKey,
  sortDir,
  onToggleSort,
  selectedIds,
  onToggleRow,
  allVisibleSelected,
  onToggleSelectAllVisible,
  deletableVisibleCount,
  busy,
  onRequestDeleteOne,
  emptyMessage,
  pagination,
  lockRole,
}: AdminUsersPwaListProps) {
  const studentsDirectory = isAdminStudentsDirectory(lockRole);
  const teachersDirectory = isAdminTeachersDirectory(lockRole);
  const parentsDirectory = isAdminParentsDirectory(lockRole);
  const sortKeys = studentsDirectory
    ? STUDENT_SORT_KEYS
    : parentsDirectory
      ? PARENT_SORT_KEYS
      : teachersDirectory
        ? TEACHER_SORT_KEYS
        : DIRECTORY_SORT_KEYS;
  const emptyValue = "—";
  const sortHint = (key: SortKey) => {
    if (sortKey !== key) return labels.sortNeutral;
    return sortDir === "asc" ? labels.sortAsc : labels.sortDesc;
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
      <div className="flex min-h-[44px] items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2">
        <input
          type="checkbox"
          className="h-4 w-4 shrink-0 rounded border-[var(--color-border)]"
          checked={allVisibleSelected}
          onChange={onToggleSelectAllVisible}
          disabled={deletableVisibleCount === 0}
          aria-label={labels.selectAllVisible}
          title={labels.tipSelectAllVisible}
        />
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {labels.selectAllVisible}
        </span>
      </div>

      <div className="flex flex-wrap gap-2" role="group">
        {sortKeys.map((key) => {
          const active = sortKey === key;
          return (
            <button
              key={key}
              type="button"
              className="flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-left text-sm font-medium text-[var(--color-primary)] active:bg-[var(--color-muted)]"
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
          <AdminUsersPwaListItem
            key={r.id}
            locale={locale}
            labels={labels}
            row={r}
            currentUserId={currentUserId}
            selected={selectedIds.has(r.id)}
            busy={busy}
            studentsDirectory={studentsDirectory}
            teachersDirectory={teachersDirectory}
            parentsDirectory={parentsDirectory}
            emptyValue={emptyValue}
            onToggleRow={onToggleRow}
            onRequestDeleteOne={onRequestDeleteOne}
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
