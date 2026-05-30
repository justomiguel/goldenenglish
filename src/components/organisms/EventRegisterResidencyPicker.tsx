"use client";

import { MapPin } from "lucide-react";

interface EventRegisterResidencyPickerProps {
  value: boolean;
  onChange: (isLocal: boolean) => void;
  labels: {
    title: string;
    local: string;
    nonLocal: string;
    localPrice: string;
    nonLocalPrice: string;
  };
  currency: string;
  priceLocal: number | null;
  priceNonLocal: number | null;
}

function formatAmount(currency: string, amount: number | null): string {
  if (amount == null || amount === 0) return "—";
  return `${currency} ${amount.toFixed(2)}`;
}

export function EventRegisterResidencyPicker({
  value,
  onChange,
  labels,
  currency,
  priceLocal,
  priceNonLocal,
}: EventRegisterResidencyPickerProps) {
  return (
    <fieldset className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <legend className="inline-flex items-center gap-2 px-1 text-sm font-semibold text-[var(--color-foreground)]">
        <MapPin className="h-4 w-4" aria-hidden />
        {labels.title}
      </legend>
      <label className="flex cursor-pointer items-start gap-2 rounded-md border border-[var(--color-border)] p-3 has-[:checked]:border-[var(--color-primary)]">
        <input
          type="radio"
          name="event-residency"
          checked={value}
          onChange={() => onChange(true)}
          className="mt-0.5"
        />
        <span className="text-sm">
          <span className="font-medium">{labels.local}</span>
          <span className="mt-0.5 block text-[var(--color-muted-foreground)]">
            {labels.localPrice.replace("{amount}", formatAmount(currency, priceLocal))}
          </span>
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-2 rounded-md border border-[var(--color-border)] p-3 has-[:checked]:border-[var(--color-primary)]">
        <input
          type="radio"
          name="event-residency"
          checked={!value}
          onChange={() => onChange(false)}
          className="mt-0.5"
        />
        <span className="text-sm">
          <span className="font-medium">{labels.nonLocal}</span>
          <span className="mt-0.5 block text-[var(--color-muted-foreground)]">
            {labels.nonLocalPrice.replace("{amount}", formatAmount(currency, priceNonLocal))}
          </span>
        </span>
      </label>
    </fieldset>
  );
}
