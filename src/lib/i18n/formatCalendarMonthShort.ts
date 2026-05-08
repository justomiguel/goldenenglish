import type { Locale } from "@/types/i18n";

/**
 * Abbreviated month name (locale month index 1–12) using a local calendar anchor.
 * Avoid `Date.UTC(..., month - 1, 1)` with `Intl`: at UTC midnight, Western
 * time zones still show the previous calendar day/month.
 */
export function formatCalendarMonthShort(locale: Locale, month1to12: number): string {
  const m = Math.min(12, Math.max(1, month1to12));
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(
    new Date(2000, m - 1, 15, 12, 0, 0),
  );
}
