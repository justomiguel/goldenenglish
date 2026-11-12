export function textCap(field: { kind: string; maxLength?: number }): number {
  if (typeof field.maxLength === "number") return field.maxLength;
  return field.kind === "longText" ? 600 : 120;
}

export function isLocaleMap(value: unknown): value is Record<"es" | "en" | "pt", string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (["es", "en", "pt"] as const).every((locale) => typeof record[locale] === "string");
}
