import { describe, expect, it } from "vitest";
import { buildDesignTokenCss } from "@/lib/design-tokens/buildDesignTokenCss";
import { parseDesignTokens } from "@/lib/design-tokens/parseDesignTokens";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import { cssVariablesBlock } from "@/lib/theme/themeOverrides";

describe("buildDesignTokenCss", () => {
  it("keeps every current alias line and adds the ds set", () => {
    const properties = { ...SYSTEM_PROPERTIES_DEFAULTS };
    const css = buildDesignTokenCss(parseDesignTokens(properties), properties);
    const alias = cssVariablesBlock(properties);
    const lines = css.split("\n");

    expect(css.startsWith(alias)).toBe(true);
    for (const line of alias.split("\n")) {
      expect(lines).toContain(line);
    }
    expect(lines).toContain("  --ds-color-primary: #103A5C;");
    expect(lines).toContain("  --ds-radius-card: 0.75rem;");
    expect(lines).toContain("  --ds-font-heading: var(--font-catalog-fraunces);");
    expect(lines).toContain("  --ds-font-body: var(--font-catalog-dm-sans);");
    expect(lines).toContain("  --font-display: var(--font-catalog-fraunces);");
    expect(lines).toContain("  --font-sans: var(--font-catalog-dm-sans);");
    expect(lines).toContain("  --ds-type-base: 16px;");
    expect(lines).toContain("  --ds-space-unit: 0.25rem;");
    expect(lines).toContain("  --ds-motion-duration: 200ms;");
    expect(css).not.toContain("Fraunces");
  });

  it("emits zero motion when the level is none", () => {
    const properties = { ...SYSTEM_PROPERTIES_DEFAULTS, "motion.level": "none" };
    const css = buildDesignTokenCss(parseDesignTokens(properties), properties);
    expect(css).toContain("  --ds-motion-duration: 0ms;");
  });

  it("skips a token value that could break the style block", () => {
    const properties = {
      ...SYSTEM_PROPERTIES_DEFAULTS,
      "color.primary": "red; } body { color: blue",
    };
    const css = buildDesignTokenCss(parseDesignTokens(properties), properties);
    expect(css).not.toContain("--ds-color-primary:");
    expect(css).not.toContain("color: blue");
  });

  it("keeps a stable order", () => {
    const properties = { ...SYSTEM_PROPERTIES_DEFAULTS };
    const ds = buildDesignTokenCss(parseDesignTokens(properties), properties)
      .split("\n")
      .filter((line) => line.includes("--ds-"));
    expect(ds).toEqual([...ds].sort());
  });
});
