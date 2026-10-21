export function formatEventDate(
  value: string | Date,
  locale: string,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeStyle: "short",
    ...opts,
  });
  return formatter.format(date);
}

/** Month and day. A date-only value stays on that calendar day. A timestamp is used as stored. */
export function formatEventDay(value: string, locale: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const source = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T12:00:00` : trimmed;
  const date = new Date(source);
  if (Number.isNaN(date.valueOf())) return "";
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
}
