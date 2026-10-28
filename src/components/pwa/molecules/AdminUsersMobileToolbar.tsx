"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, Download, Filter, Search } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminUsersFilterSortSheet } from "@/components/pwa/molecules/AdminUsersFilterSortSheet";
import { AdminUsersSortSheet } from "@/components/pwa/molecules/AdminUsersSortSheet";
import type { AdminDirectoryFilterPanelProps } from "@/components/dashboard/AdminDirectoryFilterPanel";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { academicDirectoryFilterCount } from "@/lib/academic-profile/matchAcademicProfileDirectoryFilter";
import { adminDirectoryFiltersActive } from "@/lib/dashboard/adminDirectoryFilters";
import type { AdminDirectorySortKey, AdminUsersSortCriterion } from "@/lib/dashboard/adminUsersSortCriteria";
import { adminDirectorySortKeys } from "@/lib/dashboard/adminUsersSortKeys";
import type { SortDir } from "@/lib/dashboard/adminUsersTableHelpers";
import type { Dictionary } from "@/types/i18n";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUsersMobileToolbarProps {
  labels: UserLabels;
  query: string;
  onQueryChange: (value: string) => void;
  totalCount: number;
  sortKey: AdminDirectorySortKey;
  sortDir: SortDir;
  onToggleSort: (key: AdminDirectorySortKey) => void;
  sortCriteria?: AdminUsersSortCriterion[];
  sortFieldLabels?: Record<string, string>;
  onSortCriteriaChange?: (next: AdminUsersSortCriterion[]) => void;
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
  sortCriteria,
  sortFieldLabels,
  onSortCriteriaChange,
  lockRole,
  allVisibleSelected,
  onToggleSelectAllVisible,
  selectAllDisabled,
  onExportUsers,
  directoryFilters,
}: AdminUsersMobileToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const { localValue, setLocalValue, flushNow } = useDebouncedSearch({
    value: query,
    onDebouncedChange: onQueryChange,
  });
  const searchParams = useSearchParams();
  const academicCount = academicDirectoryFilterCount(searchParams);
  const sortKeys = adminDirectorySortKeys(lockRole, sortFieldLabels);
  const criteria = sortCriteria ?? [{ key: sortKey, dir: sortDir }];
  const filterCount = activeFilterCount(directoryFilters) + academicCount;
  const filtersActive =
    directoryFilters != null &&
    (adminDirectoryFiltersActive(directoryFilters.values) || academicCount > 0);

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
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 px-3"
            aria-label={labels.mobileFilterTitle}
            onClick={() => setFilterOpen(true)}
          >
            <Filter className="h-4 w-4" aria-hidden />
            {labels.mobileFilterTitle}
            {filterCount > 0 ? <span>{filterCount}</span> : null}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 px-3"
          aria-label={labels.sortPanelTitle}
          onClick={() => setSortOpen(true)}
        >
          <ArrowUpDown className="h-4 w-4" aria-hidden />
          {labels.sortPanelTitle}
          {criteria.length > 1 ? <span>{criteria.length}</span> : null}
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
      {filtersActive && directoryFilters ? (
        <Button type="button" variant="ghost" className="min-h-9 px-2 text-xs" onClick={directoryFilters.onClear}>
          {labels.mobileClearSelection}
        </Button>
      ) : null}
      <AdminUsersFilterSortSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        labels={labels}
        directoryFilters={directoryFilters}
      />
      <AdminUsersSortSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        labels={labels}
        sortKeys={sortKeys}
        criteria={criteria}
        fieldLabels={sortFieldLabels}
        onChange={(next) => onSortCriteriaChange?.(next)}
      />
    </div>
  );
}
