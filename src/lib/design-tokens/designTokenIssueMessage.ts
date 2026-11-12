const KNOWN_CODES = [
  "contrast_below_aa",
  "token_invalid_color",
  "token_invalid_value",
  "font_not_in_catalog",
  "install_theme_unreadable",
] as const;

export type DesignTokenIssueCopy = Record<(typeof KNOWN_CODES)[number] | "unknown", string>;

export function designTokenIssueMessage(
  code: string,
  copy: DesignTokenIssueCopy,
  fields: { token?: string },
): string {
  const known = (KNOWN_CODES as readonly string[]).includes(code);
  const template = known ? copy[code as (typeof KNOWN_CODES)[number]] : copy.unknown;
  const sentence = (template ?? "")
    .replaceAll("{token}", fields.token ?? "")
    .replaceAll("{code}", code);
  if (sentence.includes(code)) return sentence;
  return sentence ? `${sentence} Code: ${code}` : code;
}
