"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { markEnrollmentFeePaidNow } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/markEnrollmentFeePaidNow";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { StaffPaymentCaptureFields } from "@/components/molecules/StaffPaymentCaptureFields";
import { todayIsoDate, type PaymentMethod } from "@/lib/billing/paymentMethod";
import type { Dictionary, Locale } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export function AdminEnrollmentFeeMarkPaidModal({
  open,
  onOpenChange,
  locale,
  studentId,
  sectionId,
  labels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
  studentId: string;
  sectionId: string | null;
  labels: BillingLabels;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paidOn, setPaidOn] = useState(todayIsoDate);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsed = amount.trim() ? Number(amount) : null;
  const amountOk = parsed == null || (Number.isFinite(parsed) && parsed > 0);

  async function save() {
    if (!amountOk) return;
    setBusy(true);
    setError(null);
    const res = await markEnrollmentFeePaidNow({
      locale,
      studentId,
      sectionId: sectionId ?? undefined,
      method,
      paidOn,
      amount: parsed ?? undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message ?? labels.error);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId="enrollment-mark-paid-title"
      title={labels.enrollmentMarkPaid}
    >
      <div className="space-y-3">
        <StaffPaymentCaptureFields
          idPrefix="enrollment-mark-paid"
          method={method}
          paidOn={paidOn}
          amount={amount}
          showAmount
          disabled={busy}
          labels={{
            paymentMethodLabel: labels.paymentMethodLabel,
            paidOnLabel: labels.paidOnLabel,
            amountLabel: labels.paymentAmountLabel,
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
        {!amountOk ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {labels.paymentAmountInvalid}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="button" disabled={busy || !amountOk} onClick={() => void save()}>
          <Check className="h-4 w-4" aria-hidden />
          {labels.enrollmentMarkPaid}
        </Button>
      </div>
    </Modal>
  );
}
