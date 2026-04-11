"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminUserRow, SortDir, SortKey } from "@/lib/dashboard/adminUsersTableHelpers";
import { Button } from "@/components/atoms/Button";
import { TablePagination } from "@/components/molecules/TablePagination";

type UserLabels = Dictionary["admin"]["users"];
type TableLabels = Dictionary["admin"]["table"];

const SORT_KEYS: SortKey[] = ["email", "name", "role", "phone"];

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
    default:
      return key;
  }
}

export interface AdminUsersPwaListProps {
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
}

export function AdminUsersPwaList({
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
}: AdminUsersPwaListProps) {
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
        />
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {labels.selectAllVisible}
        </span>
      </div>

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
        {rows.map((r) => {
          const isSelf = r.id === currentUserId;
          const checked = selectedIds.has(r.id);
          return (
            <li
              key={r.id}
              className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-sm"
            >
              <div className="flex gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--color-border)]"
                  checked={checked}
                  disabled={isSelf}
                  onChange={() => onToggleRow(r.id)}
                  aria-label={`${labels.selectRow} ${r.email}`}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="break-all font-medium text-[var(--color-foreground)]">
                    {r.email}
                  </p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {r.firstName} {r.lastName}
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="capitalize text-[var(--color-foreground)]">{r.role}</span>
                    <span className="text-[var(--color-muted-foreground)]">{r.phone}</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] min-w-[44px] shrink-0 gap-0 p-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                  disabled={isSelf || busy}
                  title={isSelf ? labels.selfProtected : undefined}
                  onClick={() => onRequestDeleteOne(r.id)}
                  aria-label={`${labels.deleteOne}: ${r.email}`}
                >
                  <Trash2 className="h-5 w-5" aria-hidden />
                </Button>
              </div>
            </li>
          );
        })}
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
