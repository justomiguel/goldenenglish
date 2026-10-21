"use client";

import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminUsersFilterSortSheet } from "@/components/pwa/molecules/AdminUsersFilterSortSheet";
import type { AdminDirectoryFilterPanelProps } from "@/components/dashboard/AdminDirectoryFilterPanel";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { adminDirectoryFiltersActive } from "@/lib/dashboard/adminDirectoryFilters";
import { adminUsersSortColumnLabel, adminUsersSortKeysForLock } from "@/lib/dashboard/adminUsersSortKeys";
import type { SortDir, SortKey } from "@/lib/dashboard/adminUsersTableHelpers";
import type { Dictionary } from "@/types/i18n";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUsersMobileToolbarProps {
  labels: UserLabels;
  query: string;
  onQueryChange: (value: string) => void;
  totalCount: number;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
  lockRole?: string;
  allVisibleSelected: boolean;
  onToggleSelectAllVisible: () => void;
  selectAllDisabled: boolean;
  onExportUsers?: () => void;
  directoryFilters?: AdminDirectoryFilterPanelProps;
}

function activeFilterCount(filters?: AdminDirectoryFilterPanelProps): number {
  if (!filters) return 0;
  return Object.values(filters.values).filter((value) => value != null && value !== "").length;
}

export function AdminUsersMobileToolbar({
  labels,
  query,
  onQueryChange,
  totalCount,
  sortKey,
  sortDir,
  onToggleSort,
  lockRole,
  allVisibleSelected,
  onToggleSelectAllVisible,
  selectAllDisabled,
  onExportUsers,
  directoryFilters,
}: AdminUsersMobileToolbarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { localValue, setLocalValue, flushNow } = useDebouncedSearch({
    value: query,
    onDebouncedChange: onQueryChange,
  });
  const sortKeys = adminUsersSortKeysForLock(lockRole);
  const filterCount = activeFilterCount(directoryFilters);
  const sortLabel = labels.mobileSortButton.replace(
    "{{field}}",
    adminUsersSortColumnLabel(labels, sortKey),
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    flushNow();
  }

  return (
    <div data-tour={ADMIN_TOUR_ANCHORS.usersToolbar} className="space-y-2">
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{labels.filterLabel}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" aria-hidden />
          <input
            value={localValue}
            onChange={(event) => setLocalValue(event.target.value)}
            placeholder={labels.filterPlaceholder}
            className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] pl-9 pr-3 text-sm text-[var(--color-foreground)]"
          />
        </label>
        {directoryFilters ? (
          <Button type="button" variant="secondary" className="min-h-11 px-3" onClick={() => setSheetOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            {filterCount > 0 ? <span>{filterCount}</span> : null}
          </Button>
        ) : null}
        <Button type="button" variant="secondary" className="min-h-11 px-3" onClick={() => setSheetOpen(true)}>
          <ArrowUpDown className="h-4 w-4" aria-hidden />
          <span className="max-w-[5.5rem] truncate text-xs">{sortLabel}</span>
          {sortDir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" aria-hidden />
          )}
        </Button>
      </form>
      <div className="flex items-center justify-between gap-2">
        <label className="inline-flex min-h-9 items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={allVisibleSelected}
            disabled={selectAllDisabled}
            onChange={onToggleSelectAllVisible}
            aria-label={labels.selectAllVisible}
          />
          <span>{labels.countTotal.replace("{{count}}", String(totalCount))}</span>
        </label>
        {onExportUsers ? (
          <Button type="button" variant="secondary" className="min-h-9 px-2.5 text-xs" onClick={onExportUsers}>
            <Download className="h-4 w-4" aria-hidden />
            {labels.exportUsers}
          </Button>
        ) : null}
      </div>
      {directoryFilters && adminDirectoryFiltersActive(directoryFilters.values) ? (
        <Button type="button" variant="ghost" className="min-h-9 px-2 text-xs" onClick={directoryFilters.onClear}>
          {labels.mobileClearSelection}
        </Button>
      ) : null}
      <AdminUsersFilterSortSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        labels={labels}
        sortKeys={sortKeys}
        sortKey={sortKey}
        sortDir={sortDir}
        onToggleSort={onToggleSort}
        directoryFilters={directoryFilters}
      />
    </div>
  );
}
