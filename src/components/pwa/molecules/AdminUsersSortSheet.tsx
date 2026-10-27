"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { AdminUsersSortChecklist } from "@/components/dashboard/AdminUsersSortChecklist";
import type { AdminUsersSortCriterion } from "@/lib/dashboard/adminUsersSortCriteria";
import type { SortKey } from "@/lib/dashboard/adminUsersTableHelpers";
import type { Dictionary } from "@/types/i18n";

type UserLabels = Dictionary["admin"]["users"];

export function AdminUsersSortSheet({
  open,
  onOpenChange,
  labels,
  sortKeys,
  criteria,
  fieldLabels,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: UserLabels;
  sortKeys: SortKey[];
  criteria: AdminUsersSortCriterion[];
  fieldLabels?: Record<string, string>;
  onChange: (next: AdminUsersSortCriterion[]) => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId="admin-users-sort-title"
      title={labels.sortPanelTitle}
      stackBelowTour
    >
      <div className="space-y-4">
        <AdminUsersSortChecklist
          labels={labels}
          sortKeys={sortKeys}
          criteria={criteria}
          fieldLabels={fieldLabels}
          onChange={onChange}
        />
        <Button type="button" className="min-h-11" onClick={() => onOpenChange(false)}>
          <Check className="h-4 w-4" aria-hidden />
          {labels.mobileApplyFilters}
        </Button>
      </div>
    </Modal>
  );
}
