import type { ShownEventChargeView } from "@/lib/events/shownEventChargeAmount";

export interface AdminEventPaymentChargeLineLabels {
  adultLine: string;
  minorLine: string;
  codeLine: string;
  codePercentLine: string;
  familyLine: string;
}

interface AdminEventPaymentChargeLinesProps {
  locale: string;
  currency: string;
  lines: ShownEventChargeView | null;
  labels: AdminEventPaymentChargeLineLabels;
}

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

export function AdminEventPaymentChargeLines({
  locale,
  currency,
  lines,
  labels,
}: AdminEventPaymentChargeLinesProps) {
  if (!lines) return null;
  const money = (price: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(price);
  const countLine = (template: string, count: number, price: number) =>
    fill(template, { count: String(count), price: money(price) });
  const discount = lines.discount;
  const discountText =
    discount?.kind === "code"
      ? fill(discount.percent != null ? labels.codePercentLine : labels.codeLine, {
          code: discount.code,
          percent: discount.percent == null ? "" : String(discount.percent),
          amount: money(-discount.amountOff),
        })
      : discount?.kind === "family"
        ? fill(labels.familyLine, { amount: money(-discount.amountOff) })
        : null;

  return (
    <div className="mt-1 space-y-0.5 text-right text-xs text-[var(--color-muted-foreground)]">
      <p>{countLine(labels.adultLine, lines.adultTickets, lines.unitPrice ?? 0)}</p>
      {lines.minorTickets > 0 ? (
        <p>{countLine(labels.minorLine, lines.minorTickets, lines.minorUnitPrice ?? 0)}</p>
      ) : null}
      {discountText ? <p className="font-medium text-[var(--color-foreground)]">{discountText}</p> : null}
    </div>
  );
}
