"use client";

import { Wallet } from "lucide-react";
import type { Dictionary, Locale } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["student"]["paymentsPwa"];

export interface StudentPaymentsPwaHeroProps {
  locale: Locale;
  labels: Labels;
  year: number;
  totalDebt: number;
  isSettled: boolean;
}

function formatMoney(locale: Locale, amount: number): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
}

export function StudentPaymentsPwaHero({
  locale,
  labels,
  year,
  totalDebt,
  isSettled,
}: StudentPaymentsPwaHeroProps) {
  if (isSettled) {
    return (
      <section
        className="rounded-[var(--layout-border-radius)] border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 px-4 py-3"
        role="status"
      >
        <p className="text-sm font-medium text-[var(--color-success)]">
          {labels.settledBanner.replace("{year}", String(year))}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4">
      <div className="flex items-start gap-3">
        <Wallet className="h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {labels.totalDebtLabel}
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-[var(--color-primary)]">
            ${formatMoney(locale, totalDebt)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {labels.totalDebtHint.replace("{year}", String(year))}
          </p>
        </div>
      </div>
    </section>
  );
}
