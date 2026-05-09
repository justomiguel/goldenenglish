"use client";

import { CreditCard, Wallet } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import type { Dictionary } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

type MonthlyLabels = Dictionary["dashboard"]["student"]["monthly"];

export interface StudentMonthlyPaymentReceiptUploadFormProps {
  locale: string;
  studentId: string;
  sectionId: string;
  month: number;
  year: number;
  expected: number | null;
  monthlyLabels: MonthlyLabels;
  paymentLabels: Dictionary["dashboard"]["student"];
  fileUploadProgress: FileUploadProgressLabels;
  busy: boolean;
  flowBusy: boolean;
  showFlowPay: boolean;
  feedbackMessage: string | null;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onFlowPay: () => void | Promise<void>;
}

export function StudentMonthlyPaymentReceiptUploadForm({
  locale,
  studentId,
  sectionId,
  month,
  year,
  expected,
  monthlyLabels,
  paymentLabels,
  fileUploadProgress,
  busy,
  flowBusy,
  showFlowPay,
  feedbackMessage,
  onSubmit,
  onFlowPay,
}: StudentMonthlyPaymentReceiptUploadFormProps) {
  const receiptInputId = useId();
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
    >
      <input type="hidden" name="locale" value={locale} readOnly />
      <input type="hidden" name="studentId" value={studentId} readOnly />
      <input type="hidden" name="sectionId" value={sectionId} readOnly />
      <input type="hidden" name="month" value={month} readOnly />
      <input type="hidden" name="year" value={year} readOnly />
      <input
        type="hidden"
        name="amount"
        value={expected != null ? String(expected) : ""}
        readOnly
      />
      <fieldset className="min-w-0 border-0 p-0">
        <legend className="text-sm font-semibold text-[var(--color-foreground)]">
          {paymentLabels.payReceipt}
        </legend>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {paymentLabels.payReceiptHint}
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            id={receiptInputId}
            name="receipt"
            type="file"
            accept="image/*,application/pdf"
            required
            aria-label={paymentLabels.payReceipt}
            className="sr-only"
            disabled={busy || flowBusy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              setReceiptFileName(f?.name ?? null);
            }}
          />
          <label
            htmlFor={receiptInputId}
            className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)] bg-[var(--color-background)] px-4 py-2 text-center text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-muted)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:ring-offset-2 sm:w-auto"
          >
            {paymentLabels.payReceiptChooseButton}
          </label>
          <p
            className="text-sm text-[var(--color-muted-foreground)] sm:min-h-[44px] sm:flex sm:max-w-[min(100%,20rem)] sm:items-center"
            aria-live="polite"
          >
            <span className="break-all font-medium text-[var(--color-foreground)]">
              {receiptFileName ?? paymentLabels.payReceiptNoFileSelected}
            </span>
          </p>
        </div>
      </fieldset>
      {busy ? (
        <InlineUploadProgressBar
          label={fileUploadProgress.progressSending}
          indeterminate
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 px-3 py-3"
        />
      ) : null}
      <Button
        type="submit"
        disabled={busy || flowBusy || expected == null}
        isLoading={busy}
        className="min-h-[44px] w-full sm:w-auto"
      >
        {!busy ? <CreditCard className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {paymentLabels.paySubmit}
      </Button>
      {showFlowPay ? (
        <>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {monthlyLabels.payWithFlowHint}
          </p>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || flowBusy}
            isLoading={flowBusy}
            onClick={() => void onFlowPay()}
            className="min-h-[44px] w-full sm:w-auto"
          >
            {!flowBusy ? <Wallet className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {monthlyLabels.payWithFlow}
          </Button>
        </>
      ) : null}
      {feedbackMessage ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{feedbackMessage}</p>
      ) : null}
    </form>
  );
}
