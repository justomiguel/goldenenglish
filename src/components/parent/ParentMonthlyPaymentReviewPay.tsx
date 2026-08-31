"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { StudentMonthlyPaymentReceiptUploadForm } from "@/components/student/StudentMonthlyPaymentReceiptUploadForm";
import type {
  SubmitMonthlyReceiptAction,
  StartOnlineMonthlyPaymentClientAction,
} from "@/components/student/StudentMonthlyPaymentFocus";
import type { ParentMonthlyPayScope } from "@/lib/billing/listPayableParentMonthSections";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";
import type { Dictionary, Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

export interface ParentMonthlyPaymentReviewPayProps {
  locale: Locale;
  studentId: string;
  originSectionId: string;
  month: number;
  year: number;
  scope: ParentMonthlyPayScope;
  total: number;
  confirmTrialCreditLabel?: string;
  studentLabels: Dictionary["dashboard"]["student"];
  fileUploadProgress: FileUploadProgressLabels;
  bankTransferInstructions: string | null;
  enabledOnlineGateways: PaymentGatewayProvider[];
  submitReceiptAction: SubmitMonthlyReceiptAction;
  startFlowAction?: StartOnlineMonthlyPaymentClientAction;
  startMercadoPagoAction?: StartOnlineMonthlyPaymentClientAction;
}

export function ParentMonthlyPaymentReviewPay({
  locale,
  studentId,
  originSectionId,
  month,
  year,
  scope,
  total,
  confirmTrialCreditLabel,
  studentLabels,
  fileUploadProgress,
  bankTransferInstructions,
  enabledOnlineGateways,
  submitReceiptAction,
  startFlowAction,
  startMercadoPagoAction,
}: ParentMonthlyPaymentReviewPayProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [onlineBusy, setOnlineBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const showOnlinePay =
    total > 0 &&
    enabledOnlineGateways.length > 0 &&
    Boolean(startFlowAction || startMercadoPagoAction);

  function withReviewFields(fd: FormData) {
    fd.set("locale", locale);
    fd.set("studentId", studentId);
    fd.set("sectionId", originSectionId);
    fd.set("month", String(month));
    fd.set("year", String(year));
    fd.set("amount", String(total));
    fd.set("scope", scope);
    return fd;
  }

  async function onSubmit(fd: FormData) {
    setBusy(true);
    setMsg(null);
    const res = await submitReceiptAction(withReviewFields(fd));
    setBusy(false);
    setMsg(res.ok ? studentLabels.paySuccess : `${studentLabels.payError}: ${res.message ?? ""}`);
    if (res.ok) router.refresh();
  }

  async function onOnlinePay(provider: PaymentGatewayProvider) {
    const action = provider === "flow" ? startFlowAction : startMercadoPagoAction;
    if (!action) return;
    setOnlineBusy(true);
    setMsg(null);
    const fd = withReviewFields(new FormData());
    const res = await action(fd);
    if (res.ok) {
      window.location.href = res.redirectUrl;
      return;
    }
    setOnlineBusy(false);
    setMsg(res.message);
  }

  if (total === 0 && confirmTrialCreditLabel) {
    return (
      <div className="space-y-3">
        <Button
          type="button"
          disabled={busy}
          isLoading={busy}
          className="min-h-[44px]"
          onClick={() => onSubmit(withReviewFields(new FormData()))}
        >
          {confirmTrialCreditLabel}
        </Button>
        {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
      </div>
    );
  }

  return (
    <StudentMonthlyPaymentReceiptUploadForm
      locale={locale}
      studentId={studentId}
      sectionId={originSectionId}
      month={month}
      year={year}
      expected={total}
      monthlyLabels={studentLabels.monthly}
      paymentLabels={studentLabels}
      fileUploadProgress={fileUploadProgress}
      busy={busy}
      onlineBusy={onlineBusy}
      showOnlinePay={showOnlinePay}
      enabledOnlineGateways={enabledOnlineGateways}
      feedbackMessage={msg}
      bankTransferInstructions={bankTransferInstructions}
      onSubmit={onSubmit}
      onOnlinePay={onOnlinePay}
    />
  );
}
