/**
 * Billing period visible on payment subjects (localized month + year).
 */
export function formatBillingPeriodLabel(locale: string, year: number, month: number): string {
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return `${month}/${year}`;
  }
  const tag = billingLocaleTag(locale);
  return new Intl.DateTimeFormat(tag, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function billingLocaleTag(locale: string): string {
  const t = locale.trim().toLowerCase();
  if (t.startsWith("es")) return t.startsWith("es-419") ? "es-419" : "es";
  return "en";
}
