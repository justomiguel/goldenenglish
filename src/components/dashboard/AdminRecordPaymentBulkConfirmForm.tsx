"use client";

import { Label } from "@/components/atoms/Label";
import { ScholarshipDiscountFields } from "@/components/molecules/ScholarshipDiscountFields";
import type { RecordPaymentBulkAction } from "@/components/dashboard/AdminRecordPaymentActionBar";
import type { Dictionary, Locale } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminRecordPaymentBulkConfirmFormProps {
  pendingAction: RecordPaymentBulkAction | null;
  paidNoteId: string;
  scholarshipNoteId: string;
  exemptNoteId: string;
  modalAdminNote: string;
  scholarshipConfirmReady: boolean;
  busy: boolean;
  locale: Locale;
  labels: BillingLabels;
  referenceMonthlyAmount: number | null;
  referenceMonthlyCurrency: string | null;
  onAdminNoteChange: (v: string) => void;
  onResolvedScholarshipPercentChange: (v: number | null) => void;
}

export function AdminRecordPaymentBulkConfirmForm({
  pendingAction,
  paidNoteId,
  scholarshipNoteId,
  exemptNoteId,
  modalAdminNote,
  scholarshipConfirmReady,
  busy,
  locale,
  labels,
  referenceMonthlyAmount,
  referenceMonthlyCurrency,
  onAdminNoteChange,
  onResolvedScholarshipPercentChange,
}: AdminRecordPaymentBulkConfirmFormProps) {
  if (pendingAction === "revert") {
    return (
      <div>
        <Label htmlFor={paidNoteId} className="text-xs">
          {labels.recordPaymentRevertNote}
        </Label>
        <input
          id={paidNoteId}
          value={modalAdminNote}
          onChange={(e) => onAdminNoteChange(e.target.value)}
          className="mt-1 min-h-[40px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
          maxLength={2000}
          placeholder={labels.recordPaymentRevertNotePlaceholder}
          disabled={busy}
          autoComplete="off"
        />
      </div>
    );
  }
  if (pendingAction === "paid") {
    return (
      <div>
        <Label htmlFor={paidNoteId} className="text-xs">
          {labels.recordPaymentNote}
        </Label>
        <input
          id={paidNoteId}
          value={modalAdminNote}
          onChange={(e) => onAdminNoteChange(e.target.value)}
          className="mt-1 min-h-[40px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
          maxLength={2000}
          placeholder={labels.recordPaymentNotePlaceholder}
          disabled={busy}
          autoComplete="off"
        />
      </div>
    );
  }
  if (pendingAction === "scholarship") {
    return (
      <>
        <ScholarshipDiscountFields
          idPrefix="record-payment-scholarship"
          locale={locale}
          currency={referenceMonthlyCurrency}
          referenceMonthlyAmount={referenceMonthlyAmount}
          labels={labels}
          disabled={busy}
          minPercent={1}
          onResolvedPercentChange={onResolvedScholarshipPercentChange}
        />
        {!scholarshipConfirmReady ? (
          <p className="text-xs text-[var(--color-error)]" role="alert">
            {labels.recordPaymentScholarshipPercentInvalid}
          </p>
        ) : null}
        <div>
          <Label htmlFor={scholarshipNoteId} className="text-xs">
            {labels.recordPaymentNote}
          </Label>
          <input
            id={scholarshipNoteId}
            value={modalAdminNote}
            onChange={(e) => onAdminNoteChange(e.target.value)}
            className="mt-1 min-h-[40px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
            maxLength={2000}
            placeholder={labels.recordPaymentNotePlaceholder}
            disabled={busy}
            autoComplete="off"
          />
        </div>
      </>
    );
  }
  if (pendingAction === "exempt") {
    return (
      <div>
        <Label htmlFor={exemptNoteId} className="text-xs">
          {labels.recordPaymentExemptModalNoteLabel}
        </Label>
        <textarea
          id={exemptNoteId}
          value={modalAdminNote}
          onChange={(e) => onAdminNoteChange(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          maxLength={2000}
          placeholder={labels.recordPaymentExemptModalNotePlaceholder}
          disabled={busy}
          autoComplete="off"
          aria-invalid={modalAdminNote.trim().length === 0 ? true : undefined}
        />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {labels.recordPaymentExemptModalNoteHint}
        </p>
      </div>
    );
  }
  return null;
}
