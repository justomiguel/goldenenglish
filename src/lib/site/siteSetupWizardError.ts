import { designTokenIssueMessage } from "@/lib/design-tokens/designTokenIssueMessage";
import type { DesignTokenIssueCopy } from "@/lib/design-tokens/designTokenIssueMessage";
import { revealFailureCode } from "@/lib/errors/revealFailureCode";

const TOKEN_CODES = new Set([
  "contrast_below_aa",
  "token_invalid_color",
  "token_invalid_value",
  "font_not_in_catalog",
  "install_theme_unreadable",
]);

export function siteSetupTokenIssue(
  code: string | null,
  token: string,
): { code: string; token: string } | null {
  if (!code || !TOKEN_CODES.has(code)) return null;
  return { code, token };
}

export function siteSetupErrorText(
  code: string,
  errors: { readonly [key: string]: string | undefined },
  issueCopy: DesignTokenIssueCopy,
  token: string,
): string {
  const mapped = errors[code];
  if (!mapped) return designTokenIssueMessage(code, issueCopy, { token });
  return revealFailureCode(mapped, code);
}
