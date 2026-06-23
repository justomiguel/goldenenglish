"use client";

import { MapPin } from "lucide-react";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import {
  publicEventRegisterResidencyFieldsetClass,
  publicEventRegisterResidencyOptionClass,
  publicEventRegisterTypography,
} from "@/lib/events/publicEventSurfaceClasses";

interface EventRegisterResidencyPickerProps {
  value: boolean;
  onChange: (isLocal: boolean) => void;
  surfaceVariant?: PublicEventSurfaceVariant;
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
  surfaceVariant = "default",
  labels,
  currency,
  priceLocal,
  priceNonLocal,
}: EventRegisterResidencyPickerProps) {
  const typography = publicEventRegisterTypography(surfaceVariant);

  return (
    <fieldset className={publicEventRegisterResidencyFieldsetClass(surfaceVariant)}>
      <legend className={`inline-flex items-center gap-2 px-1 ${typography.sectionTitle}`}>
        <MapPin className="h-4 w-4" aria-hidden />
        {labels.title}
      </legend>
      <label className={publicEventRegisterResidencyOptionClass(surfaceVariant)}>
        <input
          type="radio"
          name="event-residency"
          checked={value}
          onChange={() => onChange(true)}
          className="mt-0.5"
        />
        <span className="text-sm">
          <span className={`font-medium ${typography.body}`}>{labels.local}</span>
          <span className={`mt-0.5 block ${typography.muted}`}>
            {labels.localPrice.replace("{amount}", formatAmount(currency, priceLocal))}
          </span>
        </span>
      </label>
      <label className={publicEventRegisterResidencyOptionClass(surfaceVariant)}>
        <input
          type="radio"
          name="event-residency"
          checked={!value}
          onChange={() => onChange(false)}
          className="mt-0.5"
        />
        <span className="text-sm">
          <span className={`font-medium ${typography.body}`}>{labels.nonLocal}</span>
          <span className={`mt-0.5 block ${typography.muted}`}>
            {labels.nonLocalPrice.replace("{amount}", formatAmount(currency, priceNonLocal))}
          </span>
        </span>
      </label>
    </fieldset>
  );
}
