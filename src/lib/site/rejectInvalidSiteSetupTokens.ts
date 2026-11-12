import { validateDesignTokens } from "@/lib/design-tokens/validateDesignTokens";
import type { DesignTokenIssueCode } from "@/lib/design-tokens/validateDesignTokens";
import { logServerWarn } from "@/lib/logging/serverActionLog";
import type { ThemeProperties } from "@/lib/theme/themeParser";

export async function rejectInvalidSiteSetupTokens(args: {
  properties: ThemeProperties;
  tenantSlug: string | null;
  rollback: () => Promise<void>;
}): Promise<{ ok: false; code: DesignTokenIssueCode; token: string } | null> {
  const checked = validateDesignTokens(args.properties, { tenantSlug: args.tenantSlug });
  if (checked.ok) return null;
  const issue = checked.issues[0];
  await logServerWarn("siteSetup.saveVisual", { code: issue.code, token: issue.token });
  await args.rollback();
  return { ok: false, code: issue.code, token: issue.token };
}
