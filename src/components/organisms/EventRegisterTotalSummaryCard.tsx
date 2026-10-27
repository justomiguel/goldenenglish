"use client";

import { Receipt } from "lucide-react";
import { formatEventFlowPriceLabel } from "@/lib/events/formatEventFlowPrice";
import {
  resolveEventRegistrationTotals,
  type EventRegistrationTotals,
} from "@/lib/events/resolveEventRegistrationTotals";

export { resolveEventRegistrationTotals, type EventRegistrationTotals };

export interface EventRegisterFixedAmountLabels {
  coveredOne: string;
  coveredMany: string;
  extraOne: string;
  extraMany: string;
  off: string;
}

interface EventRegisterTotalSummaryCardProps {
  totals: EventRegistrationTotals;
  currency: string;
  locale: string;
  freeLabel: string;
  totalLabel: string;
  totalHintTemplate?: string;
  minorLines?: { adultLine: string; childLine: string };
  fixedAmountLabels?: EventRegisterFixedAmountLabels;
}

export function EventRegisterTotalSummaryCard({
  totals,
  currency,
  locale,
  freeLabel,
  totalLabel,
  totalHintTemplate,
  minorLines,
  fixedAmountLabels,
}: EventRegisterTotalSummaryCardProps) {
  if (totals.finalTotal == null || totals.finalTotal <= 0 || totals.subtotal == null) {
    return null;
  }

  const formattedUnit = formatEventFlowPriceLabel({
    price: totals.unitPrice,
    currency,
    locale,
    freeLabel,
  });
  const formattedSubtotal = formatEventFlowPriceLabel({
    price: totals.subtotal,
    currency,
    locale,
    freeLabel,
  });
  const formattedFinal = formatEventFlowPriceLabel({
    price: totals.finalTotal,
    currency,
    locale,
    freeLabel,
  });

  const seatsBreakdown =
    totals.seats > 1 && totalHintTemplate
      ? totalHintTemplate
          .replace("{{seats}}", String(totals.seats))
          .replace("{{unit}}", formattedUnit)
      : null;

  const fixed = totals.fixedAmount;
  const money = (price: number) =>
    formatEventFlowPriceLabel({ price, currency, locale, freeLabel });
  const countLine = (count: number, price: number, one: string, many: string) =>
    (count === 1 ? one : many).replace("{{count}}", String(count)).replace("{{price}}", money(price));
  const line = (template: string, count: number, price: number) =>
    template.replace("{{count}}", String(count)).replace("{{price}}", money(price));
  const showBreakdown = totals.seats > 1 || totals.hasDiscount || totals.minorTickets > 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className="overflow-hidden rounded-2xl border-2 border-[var(--color-primary)] shadow-[var(--shadow-soft)]"
    >
      {showBreakdown ? (
        <div className="space-y-2 bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-background))] px-4 py-4 sm:px-5">
          {totals.minorTickets > 0 && minorLines ? (
            <div className="space-y-1 text-sm font-medium text-[var(--color-foreground)]">
              <p>{line(minorLines.adultLine, totals.adultTickets, totals.unitPrice ?? 0)}</p>
              <p>{line(minorLines.childLine, totals.minorTickets, totals.minorUnitPrice ?? 0)}</p>
            </div>
          ) : seatsBreakdown ? (
            <p className="text-sm font-medium text-[var(--color-foreground)]">{seatsBreakdown}</p>
          ) : null}
          {totals.minorTickets > 0 ? null : (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[var(--color-muted-foreground)]">{formattedUnit}</span>
              <span className="font-medium tabular-nums text-[var(--color-foreground)]">{formattedSubtotal}</span>
            </div>
          )}
          {fixed && fixedAmountLabels ? (
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-[var(--color-primary)]">
                {countLine(fixed.covered, fixed.newUnit, fixedAmountLabels.coveredOne, fixedAmountLabels.coveredMany)}
              </p>
              <p className="text-[var(--color-foreground)]">
                {fixedAmountLabels.off.replace("{{amount}}", money(fixed.discountAmount))}
              </p>
              {fixed.extra > 0 ? (
                <p className="text-[var(--color-foreground)]">
                  {countLine(fixed.extra, fixed.unitPrice, fixedAmountLabels.extraOne, fixedAmountLabels.extraMany)}
                </p>
              ) : null}
            </div>
          ) : null}
          {totals.hasDiscount && totals.discountBadge ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-[var(--color-primary)]">{totals.discountBadge}</span>
              <span className="font-semibold tabular-nums text-[var(--color-primary)]">
                {formatEventFlowPriceLabel({
                  price: totals.finalTotal - totals.subtotal,
                  currency,
                  locale,
                  freeLabel,
                })}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="flex items-end justify-between gap-3 bg-[var(--color-primary)] px-4 py-4 text-[var(--color-primary-foreground)] sm:px-5">
        <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
          <Receipt className="h-5 w-5" aria-hidden />
          {totalLabel}
        </span>
        <p className="text-3xl font-extrabold tabular-nums sm:text-4xl">{formattedFinal}</p>
      </div>
    </div>
  );
}
