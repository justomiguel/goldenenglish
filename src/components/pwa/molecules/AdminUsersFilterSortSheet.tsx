"use client";

import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { AdminDirectoryFilterPanel } from "@/components/dashboard/AdminDirectoryFilterPanel";
import type { AdminDirectoryFilterPanelProps } from "@/components/dashboard/AdminDirectoryFilterPanel";
import type { Dictionary } from "@/types/i18n";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUsersFilterSortSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: UserLabels;
  directoryFilters?: AdminDirectoryFilterPanelProps;
}

export function AdminUsersFilterSortSheet({
  open,
  onOpenChange,
  labels,
  directoryFilters,
}: AdminUsersFilterSortSheetProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId="admin-users-filter-title"
      title={labels.mobileFilterTitle}
      stackBelowTour
    >
      <div className="space-y-4">
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
