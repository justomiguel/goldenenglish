"use client";

import {
  Check,
  CheckCircle,
  Clock,
  ExternalLink,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export function AdminEnrollmentFeeReceiptPanel({
  labels,
  receiptSignedUrl,
  receiptStatus,
  enrollmentId,
  busy,
  onReview,
}: {
  labels: BillingLabels;
  receiptSignedUrl: string | null;
  receiptStatus: "pending" | "approved" | "rejected" | null;
  enrollmentId: string | null;
  busy: boolean;
  onReview: (decision: "approved" | "rejected") => void;
}) {
  if (!receiptSignedUrl && !receiptStatus) {
    return (
      <div className="mt-6 border-t border-[var(--color-border)] pt-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.enrollmentReceiptNone}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-[var(--color-border)] pt-4 space-y-2">
      <p className="text-sm font-semibold text-[var(--color-foreground)]">
        {labels.enrollmentReceiptTitle}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {receiptStatus === "pending" && (
          <span className="flex items-center gap-1 text-sm text-[var(--color-warning)]">
            <Clock className="h-4 w-4" aria-hidden />
            {labels.enrollmentReceiptPending}
          </span>
        )}
        {receiptStatus === "approved" && (
          <span className="flex items-center gap-1 text-sm text-[var(--color-success)]">
            <CheckCircle className="h-4 w-4" aria-hidden />
            {labels.enrollmentReceiptApproved}
          </span>
        )}
        {receiptStatus === "rejected" && (
          <span className="flex items-center gap-1 text-sm text-[var(--color-error)]">
            <XCircle className="h-4 w-4" aria-hidden />
            {labels.enrollmentReceiptRejected}
          </span>
        )}
        {receiptSignedUrl && (
          <a
            href={receiptSignedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] underline underline-offset-2"
          >
            {labels.enrollmentReceiptView}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        )}
      </div>
      {receiptStatus !== "approved" && enrollmentId && (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[36px]"
            disabled={busy}
            onClick={() => onReview("approved")}
          >
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {labels.enrollmentReceiptApprove}
          </Button>
          {receiptStatus !== "rejected" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-[36px] border-[var(--color-error)] text-[var(--color-error)]"
              disabled={busy}
              onClick={() => onReview("rejected")}
            >
              <X className="h-3.5 w-3.5 shrink-0 text-[var(--color-error)]" aria-hidden />
              {labels.enrollmentReceiptReject}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
