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
