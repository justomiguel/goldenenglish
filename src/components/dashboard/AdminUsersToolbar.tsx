"use client";

import type { FormEvent } from "react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { ROLE_FILTER_ALL } from "@/lib/dashboard/adminUsersTableHelpers";

type UserLabels = Dictionary["admin"]["users"];

const ROLES = ["admin", "teacher", "student", "parent"] as const;

function tpl(template: string, count: number): string {
  return template.replace(/\{\{count\}\}/g, String(count));
}

export interface AdminUsersToolbarProps {
  labels: UserLabels;
  query: string;
  onQueryChange: (v: string) => void;
  roleFilter: string;
  onRoleFilterChange: (v: string) => void;
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  onDeleteSelected: () => void;
  onDeleteAllVisible: () => void;
  deleteDisabled: boolean;
  deleteAllVisibleDisabled: boolean;
}

export function AdminUsersToolbar({
  labels,
  query,
  onQueryChange,
  roleFilter,
  onRoleFilterChange,
  totalCount,
  filteredCount,
  selectedCount,
  onDeleteSelected,
  onDeleteAllVisible,
  deleteDisabled,
  deleteAllVisibleDisabled,
}: AdminUsersToolbarProps) {
  function onSubmitFilter(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <form onSubmit={onSubmitFilter} className="min-w-[12rem] flex-1 space-y-1">
          <Label htmlFor="users-filter">{labels.filterLabel}</Label>
          <Input
            id="users-filter"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={labels.filterPlaceholder}
            className="w-full"
            autoComplete="off"
          />
        </form>
        <div className="min-w-[10rem] space-y-1">
          <Label htmlFor="users-role-filter">{labels.roleFilterLabel}</Label>
          <select
            id="users-role-filter"
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          >
            <option value={ROLE_FILTER_ALL}>{labels.roleFilterAll}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted-foreground)]">
        <span>{tpl(labels.countTotal, totalCount)}</span>
        <span>{tpl(labels.countFiltered, filteredCount)}</span>
        <span>{tpl(labels.countSelected, selectedCount)}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={deleteDisabled}
          onClick={onDeleteSelected}
        >
          {labels.deleteSelected}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="border-[var(--color-error)]/40 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
          disabled={deleteAllVisibleDisabled}
          onClick={onDeleteAllVisible}
        >
          {labels.deleteAllVisible}
        </Button>
      </div>
    </>
  );
}
