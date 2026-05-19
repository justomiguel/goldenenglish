"use client";

import { Wallet } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { ReceiptAutoUploadField } from "@/components/molecules/ReceiptAutoUploadField";
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
  onSubmit: (formData: FormData) => void | Promise<void>;
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
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);

  function buildFormData(receipt: File): FormData {
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("studentId", studentId);
    fd.set("sectionId", sectionId);
    fd.set("month", String(month));
    fd.set("year", String(year));
    if (expected != null) fd.set("amount", String(expected));
    fd.set("receipt", receipt);
    return fd;
  }

  function uploadReceipt(file: File) {
    if (expected == null) return;
    setReceiptFileName(file.name);
    void onSubmit(buildFormData(file));
  }

  return (
    <form
      className="mt-4 space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
      onSubmit={(e) => e.preventDefault()}
    >
      <fieldset className="min-w-0 border-0 p-0">
        <legend className="text-sm font-semibold text-[var(--color-foreground)]">
          {paymentLabels.payReceipt}
        </legend>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {paymentLabels.payReceiptHint}
        </p>
        <div className="mt-3">
          <ReceiptAutoUploadField
            buttonLabel={paymentLabels.paySubmit}
            inputAriaLabel={paymentLabels.payReceipt}
            disabled={busy || flowBusy || expected == null}
            busy={busy}
            selectedFileName={receiptFileName}
            noFileSelectedLabel={paymentLabels.payReceiptNoFileSelected}
            fileUploadProgress={fileUploadProgress}
            onFileSelected={uploadReceipt}
          />
        </div>
      </fieldset>
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
