"use client";

import { useState } from "react";
import { Banknote } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { StaffPaymentCaptureFields } from "@/components/molecules/StaffPaymentCaptureFields";
import { recordRegistrationFeePaymentAction } from "@/app/[locale]/dashboard/admin/registrations/recordRegistrationFeePaymentAction";
import { todayIsoDate, type PaymentMethod } from "@/lib/billing/paymentMethod";
import type { JoinBillingDisposition } from "@/lib/billing/joinBillingDispositionSchema";
import type { Dictionary } from "@/types/i18n";

type IntakeLabels = Dictionary["admin"]["registrations"]["intake"];

export function AdminRegistrationRecordPayment({
  locale,
  registrationId,
  defaultAmount,
  labels,
  busy,
  joinDisposition,
  onRequireDisposition,
  onRun,
}: {
  locale: string;
  registrationId: string;
  defaultAmount: number;
  labels: IntakeLabels;
  busy: boolean;
  joinDisposition: JoinBillingDisposition | null;
  onRequireDisposition: () => JoinBillingDisposition | null;
  onRun: (fn: () => Promise<{ ok: boolean; code?: string }>) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paidOn, setPaidOn] = useState(todayIsoDate);
  const [amount, setAmount] = useState(defaultAmount > 0 ? String(defaultAmount) : "");
  const parsed = Number(amount);
  const amountOk = Number.isFinite(parsed) && parsed > 0;

  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.recordPaymentHint}</p>
      <StaffPaymentCaptureFields
        idPrefix={`pay-${registrationId}`}
        method={method}
        paidOn={paidOn}
        amount={amount}
        showAmount
        disabled={busy}
        labels={{
          paymentMethodLabel: labels.paymentMethodLabel,
          paidOnLabel: labels.paidOnLabel,
          amountLabel: labels.recordPaymentAmount,
          methods: {
            cash: labels.paymentMethodCash,
            transfer: labels.paymentMethodTransfer,
            card: labels.paymentMethodCard,
            gateway: labels.paymentMethodGateway,
            other: labels.paymentMethodOther,
          },
        }}
        onMethod={setMethod}
        onPaidOn={setPaidOn}
        onAmount={setAmount}
      />
      {!amountOk && amount.trim() ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {labels.recordPaymentAmountInvalid}
        </p>
      ) : null}
      <Button
        type="button"
        size="sm"
        disabled={busy || !amountOk}
        onClick={() => {
          const disposition = joinDisposition ?? onRequireDisposition();
          if (!disposition || !amountOk) return;
          onRun(() =>
            recordRegistrationFeePaymentAction({
              locale,
              registrationId,
              method,
              amount: parsed,
              paidOn,
              joinDisposition: disposition,
            }),
          );
        }}
      >
        <Banknote className="h-4 w-4" aria-hidden />
        {labels.recordPayment}
      </Button>
    </div>
  );
}
