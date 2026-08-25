"use client";

import { useState, type FormEvent } from "react";
import { ListChecks, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { ROLE_FILTER_ALL } from "@/lib/dashboard/adminUsersTableHelpers";
import { adminUserRoleOptionLabel } from "@/lib/dashboard/adminUserRoleOptionLabel";
import type { AdminUsersListRoleCounts } from "@/lib/dashboard/loadAdminUsersListRoleCounts";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { AdminUsersExportTrigger } from "@/components/molecules/AdminUsersExportModal";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

type UserLabels = Dictionary["admin"]["users"];

const ROLES = ["admin", "teacher", "student", "parent", "assistant"] as const;

function tpl(template: string, count: number): string {
  return template.replace(/\{\{count\}\}/g, String(count));
}

function tplLabelCount(template: string, label: string, count: number): string {
  return template.replace(/\{\{label\}\}/g, label).replace(/\{\{count\}\}/g, String(count));
}

function deleteSelectedButtonLabel(labels: UserLabels, selectedCount: number): string {
  if (selectedCount === 0) return labels.deleteSelected;
  const template = labels.deleteSelectedWithCount;
  if (typeof template === "string" && template.length > 0) {
    return tpl(template, selectedCount);
  }
  return `${labels.deleteSelected} (${selectedCount})`;
}

export interface AdminUsersToolbarProps {
  labels: UserLabels;
  query: string;
  onQueryChange: (v: string) => void;
  roleCounts: AdminUsersListRoleCounts;
  roleFilter: string;
  onRoleFilterChange: (v: string) => void;
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  page?: number;
  pageSize?: number;
  onDeleteSelected: () => void;
  allVisibleSelected: boolean;
  onToggleSelectAllFiltered: () => void;
  deleteDisabled: boolean;
  selectAllFilteredDisabled: boolean;
  onExportUsers?: () => void;
  lockRole?: string;
}

export function AdminUsersToolbar({
  labels,
  query,
  onQueryChange,
  roleCounts,
  roleFilter,
  onRoleFilterChange,
  totalCount,
  selectedCount,
  page = 1,
  pageSize = 10,
  onDeleteSelected,
  allVisibleSelected,
  onToggleSelectAllFiltered,
  deleteDisabled,
  selectAllFilteredDisabled,
  onExportUsers,
  lockRole,
}: AdminUsersToolbarProps) {
  const { localValue: localQuery, setLocalValue: setLocalQuery, flushNow } =
    useDebouncedSearch({ value: query, onDebouncedChange: onQueryChange });
  const [filtersOpen, setFiltersOpen] = useState(false);

  function onSubmitFilter(e: FormEvent) {
    e.preventDefault();
    flushNow();
  }

  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const showing = labels.countShowing
    .replace("{{from}}", String(from))
    .replace("{{to}}", String(to));

  return (
    <div data-tour={ADMIN_TOUR_ANCHORS.usersToolbar} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={onSubmitFilter} className="relative min-w-0 flex-1">
          <label htmlFor="users-filter" className="sr-only">
            {labels.filterLabel}
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]"
            aria-hidden
          />
          <input
            id="users-filter"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder={labels.filterPlaceholder}
            title={labels.filterTooltip}
            autoComplete="off"
            className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-2 pl-10 pr-3 text-sm outline-none ring-[var(--color-primary)] placeholder:text-[var(--color-muted-foreground)] focus-visible:ring-2"
          />
        </form>
        {lockRole ? null : (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 rounded-xl border border-[var(--color-border)] px-4"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
            {labels.filtersCta}
          </Button>
        )}
      </div>

      {!lockRole && filtersOpen ? (
        <div className="max-w-xs">
          <label htmlFor="users-role-filter" className="sr-only">
            {labels.roleFilterLabel}
          </label>
          <select
            id="users-role-filter"
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            title={labels.roleFilterTooltip}
            className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          >
            <option value={ROLE_FILTER_ALL}>
              {tpl(labels.roleFilterAllWithCount, roleCounts.total)}
            </option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {tplLabelCount(
                  labels.roleFilterOptionWithCount,
                  adminUserRoleOptionLabel(labels, r),
                  roleCounts.byRole[r] ?? 0,
                )}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {tpl(labels.countTotal, totalCount)}
          <span aria-hidden> • </span>
          {showing}
          <span aria-hidden> • </span>
          {tpl(labels.countSelected, selectedCount)}
        </p>
        <div className="flex flex-wrap gap-2">
          {onExportUsers && labels.spreadsheet ? (
            <AdminUsersExportTrigger labels={labels.spreadsheet} onClick={onExportUsers} />
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={selectAllFilteredDisabled}
            onClick={onToggleSelectAllFiltered}
            title={labels.selectAllFilteredTooltip}
            className="rounded-xl border border-[var(--color-primary)]/25 bg-[color-mix(in_srgb,var(--color-primary)_6%,white)] text-[var(--color-primary)]"
          >
            <ListChecks className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {allVisibleSelected ? labels.deselectAllFiltered : labels.selectAllFiltered}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deleteDisabled}
            onClick={onDeleteSelected}
            title={labels.deleteSelectedTooltip}
            className="rounded-xl bg-[color-mix(in_srgb,var(--color-error)_8%,white)]"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {deleteSelectedButtonLabel(labels, selectedCount)}
          </Button>
        </div>
      </div>
    </div>
  );
}
