"use client";

import { Percent } from "lucide-react";
import { Label } from "@/components/atoms/Label";
import type { RecordPaymentBulkAction } from "@/components/dashboard/AdminRecordPaymentActionBar";
import type { Dictionary } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminRecordPaymentBulkConfirmFormProps {
  pendingAction: RecordPaymentBulkAction | null;
  paidNoteId: string;
  scholarshipPctId: string;
  scholarshipNoteId: string;
  exemptNoteId: string;
  modalAdminNote: string;
  modalScholarshipPercent: string;
  scholarshipConfirmReady: boolean;
  busy: boolean;
  labels: BillingLabels;
  onAdminNoteChange: (v: string) => void;
  onScholarshipPercentChange: (v: string) => void;
}

export function AdminRecordPaymentBulkConfirmForm({
  pendingAction,
  paidNoteId,
  scholarshipPctId,
  scholarshipNoteId,
  exemptNoteId,
  modalAdminNote,
  modalScholarshipPercent,
  scholarshipConfirmReady,
  busy,
  labels,
  onAdminNoteChange,
  onScholarshipPercentChange,
}: AdminRecordPaymentBulkConfirmFormProps) {
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
        <div>
          <Label htmlFor={scholarshipPctId} className="text-xs">
            <Percent className="mr-1 inline h-3 w-3 align-text-top" aria-hidden />
            {labels.recordPaymentScholarshipPercentLabel}
          </Label>
          <input
            id={scholarshipPctId}
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            value={modalScholarshipPercent}
            onChange={(e) => onScholarshipPercentChange(e.target.value)}
            className="mt-1 min-h-[40px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
            placeholder={labels.recordPaymentScholarshipPercentPlaceholder}
            disabled={busy}
            autoComplete="off"
            aria-invalid={
              modalScholarshipPercent !== "" && !scholarshipConfirmReady ? true : undefined
            }
          />
          {modalScholarshipPercent !== "" && !scholarshipConfirmReady ? (
            <p className="mt-1 text-xs text-[var(--color-error)]" role="alert">
              {labels.recordPaymentScholarshipPercentInvalid}
            </p>
          ) : null}
        </div>
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
