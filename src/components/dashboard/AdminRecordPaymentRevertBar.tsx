"use client";

import { Undo2, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminRecordPaymentRevertBarProps {
  labels: BillingLabels;
  selectedCount: number;
  busy: boolean;
  onConfirmRevert: () => void;
  onClear: () => void;
}

export function AdminRecordPaymentRevertBar({
  labels,
  selectedCount,
  busy,
  onConfirmRevert,
  onClear,
}: AdminRecordPaymentRevertBarProps) {
  const heading = labels.recordPaymentRevertActionsTitle.replace(
    "{count}",
    String(selectedCount),
  );

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-[var(--color-primary)]">{heading}</h3>
        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-xs font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/30 disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          {labels.recordPaymentActionsCancel}
        </button>
      </div>

      <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
        {labels.recordPaymentRevertActionBarHint}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-[40px] gap-2"
          disabled={busy}
          onClick={onConfirmRevert}
        >
          <Undo2 className="h-4 w-4" aria-hidden />
          {labels.recordPaymentActionMarkUnpaid}
        </Button>
      </div>
    </div>
  );
}
