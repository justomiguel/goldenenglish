"use client";

import type { Dictionary, Locale } from "@/types/i18n";

type AnnualLabels = Dictionary["admin"]["billing"]["annualSettlement"];

export interface AdminAnnualSettlementPreviewBoxProps {
  locale: Locale;
  labels: AnnualLabels;
  preview: {
    baselineListTotal: number;
    impliedDiscountAmount: number;
    currency: string;
    billableMonthCount: number;
    monthsPreview: Array<{ month: number; listAmount: number; allocatedAmount: number }>;
  };
}

export function AdminAnnualSettlementPreviewBox({
  locale,
  labels,
  preview,
}: AdminAnnualSettlementPreviewBoxProps) {
  const money = (amount: number, currency: string) =>
    new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);

  return (
    <div className="space-y-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-3 text-sm">
      <p>
        <span className="font-medium">{labels.baseline}:</span>{" "}
        {money(preview.baselineListTotal, preview.currency)}
      </p>
      <p>
        <span className="font-medium">{labels.impliedDiscount}:</span>{" "}
        {money(preview.impliedDiscountAmount, preview.currency)}
      </p>
      <p>
        <span className="font-medium">{labels.billableMonths}:</span> {preview.billableMonthCount}
      </p>
      <ul className="list-inside list-disc space-y-0.5 text-[var(--color-muted-foreground)]">
        {preview.monthsPreview.map((row) => (
          <li key={row.month}>
            {labels.monthRow
              .replace("{month}", String(row.month))
              .replace("{list}", money(row.listAmount, preview.currency))
              .replace("{allocated}", money(row.allocatedAmount, preview.currency))}
          </li>
        ))}
      </ul>
    </div>
  );
}
