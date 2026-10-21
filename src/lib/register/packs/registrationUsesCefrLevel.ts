/** CEFR level (A1–C2) belongs to the English-school templates. Named institutes do not use it. */
const CEFR_TEMPLATE_KINDS = new Set(["classic", "editorial", "minimal"]);

export function registrationUsesCefrLevel(templateKind: string): boolean {
  return CEFR_TEMPLATE_KINDS.has(templateKind);
}
