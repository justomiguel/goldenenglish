"use client";

import { Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUsersBulkBarMobileProps {
  labels: UserLabels;
  selectedCount: number;
  onDeleteSelected: () => void;
  deleteDisabled?: boolean;
  onBulkMail?: () => void;
  bulkMailLabel?: string;
}

export function AdminUsersBulkBarMobile({
  labels,
  selectedCount,
  onDeleteSelected,
  deleteDisabled = false,
  onBulkMail,
  bulkMailLabel,
}: AdminUsersBulkBarMobileProps) {
  if (selectedCount <= 0) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 flex items-center justify-between gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 shadow-lg">
      <p className="text-sm font-semibold text-[var(--color-foreground)]">
        {labels.mobileSelectedCount.replace("{{count}}", String(selectedCount))}
      </p>
      <div className="flex items-center gap-2">
        {onBulkMail ? (
          <Button type="button" variant="secondary" className="min-h-11" onClick={onBulkMail}>
            <Mail className="h-4 w-4" aria-hidden />
            {bulkMailLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 border-[var(--color-error)] text-[var(--color-error)]"
          disabled={deleteDisabled}
          onClick={onDeleteSelected}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {labels.deleteSelected}
        </Button>
      </div>
    </div>
  );
}
