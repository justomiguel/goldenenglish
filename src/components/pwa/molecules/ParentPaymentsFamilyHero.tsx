"use client";

import { Wallet } from "lucide-react";
import type { Dictionary, Locale } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["parent"]["paymentsPwa"];

export interface ParentPaymentsFamilyHeroProps {
  locale: Locale;
  labels: Labels;
  unpaidFeesTotal: number;
}

function formatMoney(locale: Locale, amount: number): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ParentPaymentsFamilyHero({
  locale,
  labels,
  unpaidFeesTotal,
}: ParentPaymentsFamilyHeroProps) {
  if (unpaidFeesTotal <= 0) return null;

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {labels.familyTotalLabel}
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-[var(--color-primary)]">
            ${formatMoney(locale, unpaidFeesTotal)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.familyTotalHint}</p>
        </div>
      </div>
    </section>
  );
}
