import { describe, expect, it } from "vitest";
import { validateDesignTokens } from "@/lib/design-tokens/validateDesignTokens";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";

describe("validateDesignTokens install", () => {
  it("accepts a dark install color that white text can read", () => {
    const result = validateDesignTokens(
      { ...SYSTEM_PROPERTIES_DEFAULTS, "install.theme": "#070707" },
      { tenantSlug: null },
    );
    expect(result).toEqual({ ok: true });
  });

  it("accepts mid gray because black text still meets AA", () => {
    const result = validateDesignTokens(
      { ...SYSTEM_PROPERTIES_DEFAULTS, "install.theme": "#808080" },
      { tenantSlug: null },
    );
    expect(result.ok).toBe(true);
  });

  it("rejects an unknown status bar", () => {
    const result = validateDesignTokens(
      { ...SYSTEM_PROPERTIES_DEFAULTS, "install.statusBar": "glow" },
      { tenantSlug: null },
    );
    expect(result).toEqual({
      ok: false,
      issues: [{ code: "token_invalid_value", token: "install.statusBar" }],
    });
  });

  it("rejects an install color that is not hex", () => {
    const result = validateDesignTokens(
      { ...SYSTEM_PROPERTIES_DEFAULTS, "install.theme": "gold" },
      { tenantSlug: null },
    );
    expect(result).toEqual({
      ok: false,
      issues: [{ code: "token_invalid_color", token: "install.theme" }],
    });
  });
});
