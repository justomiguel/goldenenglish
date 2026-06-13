"use client";

import { ReceiptAutoUploadField } from "@/components/molecules/ReceiptAutoUploadField";
import { BankTransferInstructionsPanel } from "@/components/molecules/BankTransferInstructionsPanel";
import { OnlineMonthlyPaymentCheckoutPanel } from "@/components/molecules/OnlineMonthlyPaymentCheckoutPanel";
import type { Dictionary } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";

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
  onlineBusy: boolean;
  showOnlinePay: boolean;
  enabledOnlineGateways: PaymentGatewayProvider[];
  feedbackMessage: string | null;
  bankTransferInstructions?: string | null;
  onSubmit: (formData: FormData) => void | Promise<void>;
  onOnlinePay: (provider: PaymentGatewayProvider) => void | Promise<void>;
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
  onlineBusy,
  showOnlinePay,
  enabledOnlineGateways,
  feedbackMessage,
  bankTransferInstructions,
  onSubmit,
  onOnlinePay,
}: StudentMonthlyPaymentReceiptUploadFormProps) {
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
        {bankTransferInstructions?.trim() ? (
          <div className="mt-3">
            <BankTransferInstructionsPanel
              title={paymentLabels.transferInstructionsTitle}
              instructions={bankTransferInstructions}
            />
          </div>
        ) : null}
        <div className="mt-3">
          <ReceiptAutoUploadField
            uploadFlow="confirm"
            chooseButtonLabel={paymentLabels.payReceiptChooseButton}
            buttonLabel={paymentLabels.paySubmit}
            inputAriaLabel={paymentLabels.payReceipt}
            disabled={busy || onlineBusy || expected == null}
            busy={busy}
            noFileSelectedLabel={paymentLabels.payReceiptNoFileSelected}
            fileUploadProgress={fileUploadProgress}
            onFileSelected={uploadReceipt}
          />
        </div>
      </fieldset>
      {showOnlinePay ? (
        <OnlineMonthlyPaymentCheckoutPanel
          labels={monthlyLabels}
          enabledGateways={enabledOnlineGateways}
          busy={busy}
          onlineBusy={onlineBusy}
          feedbackMessage={feedbackMessage}
          onPay={onOnlinePay}
        />
      ) : feedbackMessage ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{feedbackMessage}</p>
      ) : null}
    </form>
  );
}
