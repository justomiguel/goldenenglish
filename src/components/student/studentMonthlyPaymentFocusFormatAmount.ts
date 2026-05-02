import type { Locale } from "@/types/i18n";

export function formatStudentMonthlyPaymentAmount(
  locale: Locale,
  amount: number,
  currency: string | null,
): string {
  void locale;
  void currency;
  return `$${amount}`;
}
