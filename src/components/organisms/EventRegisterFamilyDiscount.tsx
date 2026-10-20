"use client";

import { applyEventFamilyDiscount } from "@/lib/events/applyEventFamilyDiscount";
import { formatEventFlowPriceLabel } from "@/lib/events/formatEventFlowPrice";

interface EventRegisterFamilyDiscountProps {
  baseAmount: number | null;
  currency: string;
  locale: string;
  freeLabel: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  payLabel: string;
}

export function EventRegisterFamilyDiscount({
  baseAmount,
  currency,
  locale,
  freeLabel,
  checked,
  onChange,
  label,
  payLabel,
}: EventRegisterFamilyDiscountProps) {
  if (baseAmount == null || baseAmount <= 0) return null;
  const discounted = applyEventFamilyDiscount({ amount: baseAmount, claimed: true, currency });

  return (
    <div className="space-y-2">
      <label className="flex min-h-11 items-start gap-3 text-sm text-[var(--color-foreground)]">
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0 accent-[var(--color-primary)]"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{label}</span>
      </label>
      {checked ? (
        <p className="text-sm text-[var(--color-foreground)]">
          <span className="text-[var(--color-muted-foreground)] line-through">
            {formatEventFlowPriceLabel({ price: baseAmount, currency, locale, freeLabel })}
          </span>{" "}
          {payLabel}{" "}
          <span className="font-semibold tabular-nums text-[var(--color-primary)]">
            {formatEventFlowPriceLabel({ price: discounted, currency, locale, freeLabel })}
          </span>
        </p>
      ) : null}
    </div>
  );
}
