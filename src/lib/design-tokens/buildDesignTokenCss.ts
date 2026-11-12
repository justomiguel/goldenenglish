import { DESIGN_TOKEN_SCALE_CSS } from "@/lib/design-tokens/designTokenScales";
import {
  COLOR_TOKEN_KEYS,
  type DesignTokensV1,
} from "@/lib/design-tokens/designTokensV1";
import type { ThemeProperties } from "@/lib/theme/themeParser";
import { cssVariablesBlock, sanitizeCssValue } from "@/lib/theme/themeOverrides";

function pushLine(lines: string[], name: string, raw: string): void {
  const value = sanitizeCssValue(raw);
  if (!value) return;
  lines.push(`  ${name}: ${value};`);
}

function dsLines(tokens: DesignTokensV1): string[] {
  const lines: string[] = [];
  for (const key of COLOR_TOKEN_KEYS) {
    pushLine(lines, `--ds-color-${key.replaceAll(".", "-")}`, tokens.color[key]);
  }
  const type = DESIGN_TOKEN_SCALE_CSS.type[tokens.type.scale];
  const space = DESIGN_TOKEN_SCALE_CSS.space[tokens.space.density];
  const motion = DESIGN_TOKEN_SCALE_CSS.motion[tokens.motion.level];
  pushLine(lines, "--ds-font-heading", `var(--font-catalog-${tokens.font.heading})`);
  pushLine(lines, "--ds-font-body", `var(--font-catalog-${tokens.font.body})`);
  pushLine(lines, "--font-display", `var(--font-catalog-${tokens.font.heading})`);
  pushLine(lines, "--font-sans", `var(--font-catalog-${tokens.font.body})`);
  pushLine(lines, "--ds-type-base", type.base);
  pushLine(lines, "--ds-type-ratio", type.ratio);
  pushLine(lines, "--ds-type-heading-weight", String(tokens.type.headingWeight));
  pushLine(lines, "--ds-radius-control", tokens.radius.control);
  pushLine(lines, "--ds-radius-card", tokens.radius.card);
  pushLine(lines, "--ds-space-unit", space.unit);
  pushLine(lines, "--ds-space-section", space.section);
  pushLine(lines, "--ds-shadow-soft", tokens.shadow.soft);
  pushLine(lines, "--ds-shadow-card", tokens.shadow.card);
  pushLine(lines, "--ds-motion-duration", motion.duration);
  pushLine(lines, "--ds-motion-ease", motion.ease);
  lines.sort();
  return lines;
}

export function buildDesignTokenCss(tokens: DesignTokensV1, properties: ThemeProperties): string {
  const alias = cssVariablesBlock(properties);
  const extra = dsLines(tokens).join("\n");
  if (!alias) return extra;
  if (!extra) return alias;
  return `${alias}\n${extra}`;
}
