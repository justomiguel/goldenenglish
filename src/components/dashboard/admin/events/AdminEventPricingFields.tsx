"use client";

import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { shouldWarnEventCurrencyGateway } from "@/lib/events/resolveEventCurrencyGatewayWarning";

interface AdminEventPricingFieldsProps {
  priceLocal: string;
  priceNonLocal: string;
  currency: string;
  bankTransferInstructions: string;
  disabled?: boolean;
  labels: {
    priceLocalLabel: string;
    priceNonLocalLabel: string;
    priceHint: string;
    currencyLabel: string;
    currencyGatewayWarning: string;
    bankTransferInstructionsLabel: string;
    bankTransferInstructionsHint: string;
  };
  onPriceLocalChange: (value: string) => void;
  onPriceNonLocalChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onBankTransferInstructionsChange: (value: string) => void;
}

export function AdminEventPricingFields({
  priceLocal,
  priceNonLocal,
  currency,
  bankTransferInstructions,
  disabled,
  labels,
  onPriceLocalChange,
  onPriceNonLocalChange,
  onCurrencyChange,
  onBankTransferInstructionsChange,
}: AdminEventPricingFieldsProps) {
  const showCurrencyWarning = shouldWarnEventCurrencyGateway({
    currency,
    priceLocal,
    priceNonLocal,
  });
  return (
    <>
      <div>
        <Label htmlFor="event-price-local">{labels.priceLocalLabel}</Label>
        <Input
          id="event-price-local"
          type="number"
          min={0}
          step="0.01"
          value={priceLocal}
          onChange={(e) => onPriceLocalChange(e.target.value)}
          disabled={disabled}
          className="mt-1"
        />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.priceHint}</p>
      </div>
      <div>
        <Label htmlFor="event-price-non-local">{labels.priceNonLocalLabel}</Label>
        <Input
          id="event-price-non-local"
          type="number"
          min={0}
          step="0.01"
          value={priceNonLocal}
          onChange={(e) => onPriceNonLocalChange(e.target.value)}
          disabled={disabled}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="event-currency">{labels.currencyLabel}</Label>
        <Input
          id="event-currency"
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value.toUpperCase())}
          disabled={disabled}
          maxLength={8}
          className="mt-1"
        />
        {showCurrencyWarning ? (
          <p
            className="mt-2 flex items-start gap-2 rounded-md border border-[var(--color-warning)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-foreground)]"
            role="status"
          >
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]"
              aria-hidden
            />
            <span>{labels.currencyGatewayWarning}</span>
          </p>
        ) : null}
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="event-bank-transfer-instructions">
          {labels.bankTransferInstructionsLabel}
        </Label>
        <textarea
          id="event-bank-transfer-instructions"
          value={bankTransferInstructions}
          onChange={(e) => onBankTransferInstructionsChange(e.target.value)}
          disabled={disabled}
          rows={5}
          className="mt-1 min-h-[120px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
        />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {labels.bankTransferInstructionsHint}
        </p>
      </div>
    </>
  );
}
