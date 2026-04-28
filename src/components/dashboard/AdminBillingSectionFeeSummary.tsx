"use client";

import { Receipt, Wallet } from "lucide-react";
import { DEFAULT_SECTION_FEE_PLAN_CURRENCY } from "@/types/sectionFeePlan";
import type { Locale } from "@/types/i18n";

function formatMoney(locale: Locale, amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export interface AdminBillingSectionFeeSummaryProps {
  locale: Locale;
  enrollmentAmount: number;
  enrollmentCurrency: string;
  monthlyAmount: number | null;
  monthlyCurrency: string | null;
  labels: {
    enrollmentLabel: string;
    monthlyLabel: string;
    monthlyUnavailable: string;
    enrollmentNotCharged: string;
  };
}

export function AdminBillingSectionFeeSummary({
  locale,
  enrollmentAmount,
  enrollmentCurrency,
  monthlyAmount,
  monthlyCurrency,
  labels,
}: AdminBillingSectionFeeSummaryProps) {
  const enrollCur = enrollmentCurrency || DEFAULT_SECTION_FEE_PLAN_CURRENCY;
  const enrollmentDisplay =
    enrollmentAmount > 0 ? formatMoney(locale, enrollmentAmount, enrollCur) : labels.enrollmentNotCharged;

  const monthlyCur = monthlyCurrency ?? DEFAULT_SECTION_FEE_PLAN_CURRENCY;
  const monthlyDisplay =
    monthlyAmount != null &&
    Number.isFinite(monthlyAmount) &&
    monthlyAmount >= 0 &&
    monthlyCurrency
      ? formatMoney(locale, monthlyAmount, monthlyCur)
      : labels.monthlyUnavailable;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)]/40 bg-[var(--color-primary)]/[0.07] px-4 py-3 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          <Receipt className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
          {labels.enrollmentLabel}
        </p>
        <p className="mt-1 font-display text-2xl font-bold tabular-nums tracking-tight text-[var(--color-secondary)]">
          {enrollmentDisplay}
        </p>
      </div>
      <div className="rounded-[var(--layout-border-radius)] border-2 border-[var(--color-success)]/45 bg-[var(--color-success)]/[0.1] px-4 py-3 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          <Wallet className="h-4 w-4 shrink-0 text-[var(--color-success)]" aria-hidden />
          {labels.monthlyLabel}
        </p>
        <p className="mt-1 font-display text-2xl font-bold tabular-nums tracking-tight text-[var(--color-secondary)]">
          {monthlyDisplay}
        </p>
      </div>
    </div>
  );
}
