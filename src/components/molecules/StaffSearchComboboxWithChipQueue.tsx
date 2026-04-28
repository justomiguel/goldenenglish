"use client";

import { useMemo } from "react";
import {
  AdminStudentSearchCombobox,
  type AdminStudentSearchComboboxProps,
  type AdminStudentSearchHitLike,
} from "@/components/molecules/AdminStudentSearchCombobox";
import { EnrollmentStudentQueue } from "@/components/molecules/EnrollmentStudentQueue";

export type StaffSearchComboboxWithChipQueueProps = Omit<
  AdminStudentSearchComboboxProps,
  "onPick" | "excludeIds"
> & {
  /** Ids always excluded from suggestions (e.g. already persisted relations). Queue ids are added automatically. */
  persistentExcludeIds?: readonly string[];
  selectedItems: AdminStudentSearchHitLike[];
  onPick: (hit: AdminStudentSearchHitLike) => void;
  onRemoveSelected: (id: string) => void;
  queueLegend: string;
  queueReminder: string;
  removeChipAriaLabel: string;
  queueDisabled?: boolean;
};

/**
 * Staff picker: async prefix combobox + chip queue (same UX as section enrollment).
 * State stays in the parent so hooks can own side effects (enroll, link, etc.).
 */
export function StaffSearchComboboxWithChipQueue({
  persistentExcludeIds,
  selectedItems,
  onPick,
  onRemoveSelected,
  queueLegend,
  queueReminder,
  removeChipAriaLabel,
  queueDisabled,
  ...comboboxProps
}: StaffSearchComboboxWithChipQueueProps) {
  const excludeIds = useMemo(() => {
    const fromQueue = selectedItems.map((s) => s.id);
    const base = persistentExcludeIds ?? [];
    return base.length === 0 ? fromQueue : [...base, ...fromQueue];
  }, [persistentExcludeIds, selectedItems]);

  return (
    <div className="space-y-3">
      <AdminStudentSearchCombobox {...comboboxProps} excludeIds={excludeIds} onPick={onPick} />
      <EnrollmentStudentQueue
        legend={queueLegend}
        reminder={queueReminder}
        removeAria={removeChipAriaLabel}
        items={selectedItems}
        onRemove={onRemoveSelected}
        disabled={queueDisabled}
      />
    </div>
  );
}
