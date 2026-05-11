import type { Locale } from "@/types/i18n";
import type { StudentMonthlyPaymentSectionRow } from "@/types/studentMonthlyPayments";

export function studentMonthlyEnrollmentFeeDisplay(
  locale: Locale,
  amount: number,
  currency: string | null,
): string {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  if (currency) {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      /* unknown ISO currency */
    }
  }
  const numeric = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(amount);
  return currency ? `${currency} ${numeric}` : numeric;
}

export function monthlyStripFindCell(section: StudentMonthlyPaymentSectionRow, month: number) {
  return section.cells.find((c) => c.month === month) ?? null;
}
