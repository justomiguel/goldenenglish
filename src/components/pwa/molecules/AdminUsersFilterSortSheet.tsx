"use client";

import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { AdminDirectoryFilterPanel } from "@/components/dashboard/AdminDirectoryFilterPanel";
import type { AdminDirectoryFilterPanelProps } from "@/components/dashboard/AdminDirectoryFilterPanel";
import type { Dictionary } from "@/types/i18n";
import type { SortDir, SortKey } from "@/lib/dashboard/adminUsersTableHelpers";
import { adminUsersSortColumnLabel } from "@/lib/dashboard/adminUsersSortKeys";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUsersFilterSortSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: UserLabels;
  sortKeys: SortKey[];
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
  directoryFilters?: AdminDirectoryFilterPanelProps;
}

export function AdminUsersFilterSortSheet({
  open,
  onOpenChange,
  labels,
  sortKeys,
  sortKey,
  sortDir,
  onToggleSort,
  directoryFilters,
}: AdminUsersFilterSortSheetProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId="admin-users-filter-sort-title"
      title={labels.mobileFilterSortTitle}
      stackBelowTour
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            {labels.mobileSortSectionTitle}
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant={sortDir === "asc" ? "primary" : "secondary"}
              className="min-h-11 flex-1"
              onClick={() => {
                if (sortDir !== "asc") onToggleSort(sortKey);
              }}
            >
              {labels.mobileSortAsc}
            </Button>
            <Button
              type="button"
              variant={sortDir === "desc" ? "primary" : "secondary"}
              className="min-h-11 flex-1"
              onClick={() => {
                if (sortDir !== "desc") onToggleSort(sortKey);
              }}
            >
              {labels.mobileSortDesc}
            </Button>
          </div>
          <ul className="mt-3 space-y-1">
            {sortKeys.map((key) => {
              const active = key === sortKey;
              return (
                <li key={key}>
                  <button
                    type="button"
                    aria-pressed={active}
                    className={`flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium ${
                      active
                        ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                        : "border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]"
                    }`}
                    onClick={() => onToggleSort(key)}
                  >
                    {adminUsersSortColumnLabel(labels, key)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        {directoryFilters ? <AdminDirectoryFilterPanel {...directoryFilters} /> : null}
        <div className="flex flex-wrap gap-2">
          {directoryFilters ? (
            <Button type="button" variant="secondary" className="min-h-11" onClick={directoryFilters.onClear}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              {labels.mobileClearSelection}
            </Button>
          ) : null}
          <Button type="button" className="min-h-11" onClick={() => onOpenChange(false)}>
            <Check className="h-4 w-4" aria-hidden />
            {labels.mobileApplyFilters}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
