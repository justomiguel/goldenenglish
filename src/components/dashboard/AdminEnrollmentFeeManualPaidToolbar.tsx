"use client";

import { Banknote, Undo2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminEnrollmentFeeManualPaidToolbarProps {
  labels: BillingLabels;
  /** ISO date/time of last enrollment payment; informs copy and may imply clear availability. */
  initialLastPaidAt: string | null;
  /** Current receipt review row; `"approved"` means staff can revert to unpaid per server action. */
  receiptStatus: "pending" | "approved" | "rejected" | null;
  readOnly: boolean;
  busy: boolean;
  onMarkPaid: () => void;
  onOpenClearConfirm: () => void;
}

export function AdminEnrollmentFeeManualPaidToolbar({
  labels,
  initialLastPaidAt,
  receiptStatus,
  readOnly,
  busy,
  onMarkPaid,
  onOpenClearConfirm,
}: AdminEnrollmentFeeManualPaidToolbarProps) {
  const showClearEnrollmentPaid =
    Boolean(initialLastPaidAt?.trim()) || receiptStatus === "approved";

  return (
    <div className="mt-6 border-t border-[var(--color-border)] pt-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {labels.enrollmentLastPaid}:{" "}
        {initialLastPaidAt
          ? new Date(initialLastPaidAt).toLocaleDateString()
          : labels.enrollmentNonePaid}
      </p>
      {!readOnly ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            className="min-h-[44px]"
            disabled={busy}
            onClick={() => onMarkPaid()}
          >
            <Banknote className="h-4 w-4 shrink-0" aria-hidden />
            {labels.enrollmentMarkPaid}
          </Button>
          {showClearEnrollmentPaid ? (
            <Button
              type="button"
              variant="ghost"
              className="min-h-[44px] border border-[var(--color-border)] text-[var(--color-foreground)]"
              disabled={busy}
              onClick={() => onOpenClearConfirm()}
            >
              <Undo2 className="h-4 w-4 shrink-0" aria-hidden />
              {labels.enrollmentClearManualPaid}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
