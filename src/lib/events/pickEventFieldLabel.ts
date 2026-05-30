export function pickEventFieldLabel(
  labels: Record<string, string> | null | undefined,
  locale: string,
  defaultLocale: string,
): string {
  if (!labels) return "";
  return labels[locale] ?? labels[defaultLocale] ?? Object.values(labels)[0] ?? "";
}
