import { Wallet } from "lucide-react";
import {
  formatMonthlyDueTotals,
  type MonthlyDueTotal,
} from "@/lib/billing/sumDiscountedMonthlyDue";
import type { Locale } from "@/types/i18n";

export function AdminStudentPersonMonthlyDue({
  locale,
  totals,
  label,
  unavailable,
}: {
  locale: Locale;
  totals: readonly MonthlyDueTotal[];
  label: string;
  unavailable: string;
}) {
  const formatted = formatMonthlyDueTotals(totals, locale);
  return (
    <section
      aria-label={label}
      className="rounded-[var(--layout-border-radius)] border-2 border-[var(--color-success)]/45 bg-[var(--color-success)]/[0.1] px-4 py-3 shadow-sm"
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        <Wallet className="h-4 w-4 shrink-0 text-[var(--color-success)]" aria-hidden />
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums tracking-tight text-[var(--color-primary)]">
        {formatted || unavailable}
      </p>
    </section>
  );
}
