"use client";

import { useState } from "react";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import {
  SUGGESTED_BILLING_CURRENCIES,
  normalizeBillingCurrencyInput,
} from "@/lib/billing/billingCurrencyConstants";

export interface BillingCurrencySelectFieldProps {
  id: string;
  value: string;
  onChange: (currency: string) => void;
  label: string;
  otherOptionLabel: string;
  otherInputAriaLabel: string;
  disabled?: boolean;
}

export function BillingCurrencySelectField({
  id,
  value,
  onChange,
  label,
  otherOptionLabel,
  otherInputAriaLabel,
  disabled = false,
}: BillingCurrencySelectFieldProps) {
  const normalized = normalizeBillingCurrencyInput(value);
  const [customMode, setCustomMode] = useState(
    !SUGGESTED_BILLING_CURRENCIES.includes(
      normalized as (typeof SUGGESTED_BILLING_CURRENCIES)[number],
    ),
  );

  const onSelectChange = (next: string) => {
    if (next === "__other__") {
      setCustomMode(true);
      return;
    }
    setCustomMode(false);
    onChange(next);
  };

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={
          customMode
            ? "__other__"
            : SUGGESTED_BILLING_CURRENCIES.includes(
                  normalized as (typeof SUGGESTED_BILLING_CURRENCIES)[number],
                )
              ? normalized
              : "__other__"
        }
        onChange={(e) => onSelectChange(e.target.value)}
        disabled={disabled}
        className="mt-1 min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
      >
        {SUGGESTED_BILLING_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
        <option value="__other__">{otherOptionLabel}</option>
      </select>
      {customMode ? (
        <Input
          id={`${id}-custom`}
          className="mt-2"
          type="text"
          maxLength={3}
          minLength={3}
          pattern="[A-Za-z]{3}"
          placeholder="BOB"
          aria-label={otherInputAriaLabel}
          value={value}
          onChange={(e) => onChange(normalizeBillingCurrencyInput(e.target.value))}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}
