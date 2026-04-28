"use client";

import { Check, GraduationCap, ShieldOff, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export type RecordPaymentBulkAction = "paid" | "scholarship" | "exempt";

export interface AdminRecordPaymentActionBarProps {
  labels: BillingLabels;
  selectedCount: number;
  busy: boolean;
  onAction: (action: RecordPaymentBulkAction) => void;
  onClear: () => void;
}

export function AdminRecordPaymentActionBar({
  labels,
  selectedCount,
  busy,
  onAction,
  onClear,
}: AdminRecordPaymentActionBarProps) {
  const heading = labels.recordPaymentActionsTitle.replace(
    "{count}",
    String(selectedCount),
  );

  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/[0.04] p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-[var(--color-secondary)]">{heading}</h3>
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
        {labels.recordPaymentActionBarHint}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="min-h-[40px] gap-2"
          disabled={busy}
          onClick={() => onAction("paid")}
        >
          <Check className="h-4 w-4" aria-hidden />
          {labels.recordPaymentActionMarkPaid}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-[40px] gap-2"
          disabled={busy}
          onClick={() => onAction("scholarship")}
        >
          <GraduationCap className="h-4 w-4" aria-hidden />
          {labels.recordPaymentActionAddScholarship}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-[40px] gap-2"
          disabled={busy}
          onClick={() => onAction("exempt")}
        >
          <ShieldOff className="h-4 w-4" aria-hidden />
          {labels.recordPaymentActionMarkExempt}
        </Button>
      </div>
    </div>
  );
}
