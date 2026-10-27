"use client";

import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { shouldWarnEventCurrencyGateway } from "@/lib/events/resolveEventCurrencyGatewayWarning";

interface AdminEventResidencyPriceFieldsProps {
  priceLocal: string;
  priceNonLocal: string;
  currency: string;
  disabled?: boolean;
  labels: {
    priceLocalLabel: string;
    priceNonLocalLabel: string;
    priceHint: string;
    currencyLabel: string;
    currencyGatewayWarning: string;
    allowFamilyDiscountLabel?: string;
    allowMinorTicketsLabel?: string;
    minorTicketPriceLabel?: string;
    minorTicketPriceHint?: string;
  };
  onPriceLocalChange: (value: string) => void;
  onPriceNonLocalChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  allowFamilyDiscount?: boolean;
  onAllowFamilyDiscountChange?: (checked: boolean) => void;
  allowMinorTickets?: boolean;
  onAllowMinorTicketsChange?: (checked: boolean) => void;
  minorTicketPrice?: string;
  onMinorTicketPriceChange?: (value: string) => void;
}

export function AdminEventResidencyPriceFields({
  priceLocal,
  priceNonLocal,
  currency,
  disabled,
  labels,
  onPriceLocalChange,
  onPriceNonLocalChange,
  onCurrencyChange,
  allowFamilyDiscount,
  onAllowFamilyDiscountChange,
  allowMinorTickets,
  onAllowMinorTicketsChange,
  minorTicketPrice = "",
  onMinorTicketPriceChange,
}: AdminEventResidencyPriceFieldsProps) {
  const showCurrencyWarning = shouldWarnEventCurrencyGateway({
    currency,
    priceLocal,
    priceNonLocal,
  });

  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
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
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]" aria-hidden />
            <span>{labels.currencyGatewayWarning}</span>
          </p>
        ) : null}
      </div>
      </div>
      {labels.allowFamilyDiscountLabel && onAllowFamilyDiscountChange ? (
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
          <input
            type="checkbox"
            checked={Boolean(allowFamilyDiscount)}
            disabled={disabled}
            onChange={(e) => onAllowFamilyDiscountChange(e.target.checked)}
          />
          <span>{labels.allowFamilyDiscountLabel}</span>
        </label>
      ) : null}
      {labels.allowMinorTicketsLabel && onAllowMinorTicketsChange ? (
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
          <input
            id="event-allow-minor-tickets"
            type="checkbox"
            checked={Boolean(allowMinorTickets)}
            disabled={disabled}
            onChange={(e) => onAllowMinorTicketsChange(e.target.checked)}
          />
          <span>{labels.allowMinorTicketsLabel}</span>
        </label>
      ) : null}
      {allowMinorTickets && labels.minorTicketPriceLabel && onMinorTicketPriceChange ? (
        <div>
          <Label htmlFor="event-minor-ticket-price">{labels.minorTicketPriceLabel}</Label>
          <Input
            id="event-minor-ticket-price"
            type="number"
            min={0}
            step="1"
            value={minorTicketPrice}
            onChange={(e) => onMinorTicketPriceChange(e.target.value)}
            disabled={disabled}
            className="mt-1 max-w-xs"
          />
          {labels.minorTicketPriceHint ? (
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.minorTicketPriceHint}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
