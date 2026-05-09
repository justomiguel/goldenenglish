"use client";

import { CheckSquare, Square, Check, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";

export interface FinanceInboxBulkToolbarLabels {
  bulkSelectAllAria: string;
  bulkSelectAll: string;
  bulkClearSelection: string;
  bulkSelectedCount: string;
  bulkApproveSelected: string;
  bulkDestructiveSelected: string;
}

export interface FinanceInboxBulkToolbarProps {
  labels: FinanceInboxBulkToolbarLabels;
  /** Monthly inbox removes rows; enrollment/invoice use reject. */
  destructiveIcon?: "reject" | "delete";
  allSelected: boolean;
  selectedCount: number;
  busy: boolean;
  onToggleAll: () => void;
  onApprove: () => void;
  onOpenDestructive: () => void;
}

export function FinanceInboxBulkToolbar({
  labels,
  destructiveIcon = "reject",
  allSelected,
  selectedCount,
  busy,
  onToggleAll,
  onApprove,
  onOpenDestructive,
}: FinanceInboxBulkToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-3">
      <button
        type="button"
        onClick={onToggleAll}
        disabled={busy}
        aria-pressed={allSelected}
        aria-label={labels.bulkSelectAllAria}
        className="inline-flex min-h-[36px] shrink-0 items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/30 disabled:opacity-50"
      >
        {allSelected ? (
          <CheckSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />
        ) : (
          <Square className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        {allSelected ? labels.bulkClearSelection : labels.bulkSelectAll}
      </button>
      <span className="text-sm text-[var(--color-muted-foreground)]">
        {labels.bulkSelectedCount
          .replaceAll("{{count}}", String(selectedCount))
          .replaceAll("{count}", String(selectedCount))}
      </span>
      <div className="ml-auto flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="min-h-[36px]"
          disabled={busy || selectedCount === 0}
          onClick={onApprove}
        >
          <Check className="h-4 w-4" aria-hidden />
          {labels.bulkApproveSelected}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-[36px] border-[var(--color-error)] text-[var(--color-error)]"
          disabled={busy || selectedCount === 0}
          onClick={onOpenDestructive}
        >
          {destructiveIcon === "delete" ? (
            <Trash2 className="h-4 w-4" aria-hidden />
          ) : (
            <XCircle className="h-4 w-4" aria-hidden />
          )}
          {labels.bulkDestructiveSelected}
        </Button>
      </div>
    </div>
  );
}
