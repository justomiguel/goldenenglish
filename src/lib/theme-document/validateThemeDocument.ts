import { COLOR_TOKEN_KEYS } from "@/lib/design-tokens/designTokensV1";
import { validateDesignTokens } from "@/lib/design-tokens/validateDesignTokens";
import { resolveSection } from "@/lib/design-variants/variantRegistry";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import type { ThemeDocumentV1, ThemePageId } from "@/lib/theme-document/themeDocumentV1";
import { THEME_PAGE_IDS } from "@/lib/theme-document/themeDocumentV1";
import type { ThemeProperties } from "@/lib/theme/themeParser";

export interface ThemeDocumentIssue {
  code: string;
  path?: string;
  token?: string;
}

function flatTokens(doc: ThemeDocumentV1): ThemeProperties {
  const properties: ThemeProperties = {
    "font.heading": doc.fontIds.heading,
    "font.body": doc.fontIds.body,
    "type.scale": doc.tokens.type.scale,
    "type.heading.weight": String(doc.tokens.type.headingWeight),
    "space.density": doc.tokens.space.density,
    "motion.level": doc.tokens.motion.level,
  };
  for (const key of COLOR_TOKEN_KEYS) properties[`color.${key}`] = doc.tokens.color[key];
  return properties;
}

function tokenPath(token: string): string {
  if (token === "font.heading") return "fontIds.heading";
  if (token === "font.body") return "fontIds.body";
  if (token.startsWith("color.")) return `tokens.${token}`;
  return `tokens.${token}`;
}

function checkSections(
  sections: readonly ThemeSection[],
  tenantSlug: string | null,
  prefix: string,
  issues: ThemeDocumentIssue[],
): void {
  for (const section of sections) {
    const resolved = resolveSection(section, tenantSlug);
    if (resolved.ok) continue;
    issues.push({ code: resolved.code, path: `${prefix}${section.id}` });
  }
}

export function validateThemeDocument(
  doc: ThemeDocumentV1,
  tenantSlug: string | null,
): { ok: true } | { ok: false; issues: ThemeDocumentIssue[] } {
  const issues: ThemeDocumentIssue[] = [];
  for (const key of COLOR_TOKEN_KEYS) {
    if (doc.tokens.color[key].trim()) continue;
    issues.push({ code: "token_missing", token: `color.${key}`, path: `tokens.color.${key}` });
  }
  const checked = validateDesignTokens(flatTokens(doc), { tenantSlug });
  if (!checked.ok) {
    for (const issue of checked.issues) {
      issues.push({ code: issue.code, token: issue.token, path: tokenPath(issue.token) });
    }
  }
  checkSections(doc.sections, tenantSlug, "sections.", issues);
  for (const pageId of THEME_PAGE_IDS) {
    const page = doc.pages[pageId as ThemePageId];
    if (!page) continue;
    checkSections(page.sections, tenantSlug, `pages.${pageId}.sections.`, issues);
  }
  if (issues.length === 0) return { ok: true };
  return { ok: false, issues };
}
