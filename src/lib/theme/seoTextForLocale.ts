/** Theme override for the home title or description. Empty means use the brand fallback. */
export function seoTextForLocale(
  properties: Readonly<Record<string, string>> | null | undefined,
  locale: string,
  field: "title" | "description",
): string {
  const base = `app.seo.${field}`;
  const localized =
    locale === "en" ? properties?.[`${base}.en`] : locale === "pt" ? properties?.[`${base}.pt`] : "";
  const value = (localized || properties?.[base] || "").trim();
  return value;
}
