"use client";

import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/billing/paymentMethod";

export interface StaffPaymentCaptureLabels {
  paymentMethodLabel: string;
  paidOnLabel: string;
  amountLabel: string;
  methods: Record<PaymentMethod, string>;
}

export interface StaffPaymentCaptureFieldsProps {
  idPrefix: string;
  method: PaymentMethod;
  paidOn: string;
  amount: string;
  showAmount: boolean;
  disabled: boolean;
  labels: StaffPaymentCaptureLabels;
  onMethod: (method: PaymentMethod) => void;
  onPaidOn: (value: string) => void;
  onAmount: (value: string) => void;
}

export function StaffPaymentCaptureFields({
  idPrefix,
  method,
  paidOn,
  amount,
  showAmount,
  disabled,
  labels,
  onMethod,
  onPaidOn,
  onAmount,
}: StaffPaymentCaptureFieldsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-method`}>{labels.paymentMethodLabel}</Label>
        <select
          id={`${idPrefix}-method`}
          value={method}
          disabled={disabled}
          onChange={(event) => onMethod(event.target.value as PaymentMethod)}
          className="min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)]"
        >
          {PAYMENT_METHODS.map((item) => (
            <option key={item} value={item}>
              {labels.methods[item]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-date`}>{labels.paidOnLabel}</Label>
        <Input
          id={`${idPrefix}-date`}
          type="date"
          value={paidOn}
          disabled={disabled}
          onChange={(event) => onPaidOn(event.target.value)}
        />
      </div>
      {showAmount ? (
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-amount`}>{labels.amountLabel}</Label>
          <Input
            id={`${idPrefix}-amount`}
            type="number"
            min={0}
            step="0.01"
            value={amount}
            disabled={disabled}
            onChange={(event) => onAmount(event.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}
