import { describe, expect, it } from "vitest";
import { COLOR_TOKEN_KEYS, type DesignTokensV1 } from "@/lib/design-tokens/designTokensV1";
import { validateThemeDocument } from "@/lib/theme-document/validateThemeDocument";
import type { ThemeDocumentV1, ThemePageId } from "@/lib/theme-document/themeDocumentV1";

function color(fill: string): DesignTokensV1["color"] {
  const value = Object.fromEntries(COLOR_TOKEN_KEYS.map((key) => [key, fill])) as DesignTokensV1["color"];
  value.foreground = "#111111";
  value["primary.foreground"] = "#111111";
  value["secondary.foreground"] = "#111111";
  value["accent.foreground"] = "#111111";
  value["muted.foreground"] = "#111111";
  value.border = "#595959";
  return value;
}

function document(patch: Partial<ThemeDocumentV1> = {}): ThemeDocumentV1 {
  return {
    contractVersion: 1,
    tokens: {
      version: 1,
      color: color("#FFFFFF"),
      font: { heading: "fraunces", body: "dm-sans" },
      type: { scale: "standard", headingWeight: 600 },
      radius: { control: "0.75rem", card: "0.75rem" },
      space: { density: "standard" },
      shadow: { soft: "none", card: "none" },
      motion: { level: "subtle" },
    },
    fontIds: { heading: "fraunces", body: "dm-sans" },
    sections: [],
    pages: {},
    editableBy: {},
    ...patch,
  };
}

function codes(doc: ThemeDocumentV1, slug: string | null = "golden") {
  const result = validateThemeDocument(doc, slug);
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

describe("validateThemeDocument", () => {
  it("reports contrast_below_aa", () => {
    const doc = document();
    doc.tokens.color.primary = "#FFFF00";
    doc.tokens.color["primary.foreground"] = "#FFFFFF";
    expect(codes(doc)).toContain("contrast_below_aa");
  });

  it("reports font_not_in_catalog", () => {
    const doc = document();
    doc.fontIds.heading = "not-a-font";
    expect(codes(doc)).toContain("font_not_in_catalog");
  });

  it("reports variant_version_missing", () => {
    const doc = document({
      sections: [{ id: "hero", variantId: "hero.bleed", major: 9, props: {} }],
    });
    expect(codes(doc)).toContain("variant_version_missing");
  });

  it("reports variant_not_available for another tenant", () => {
    const doc = document({
      sections: [{ id: "home", variantId: "page.bespoke-liora", major: 1, props: {} }],
    });
    expect(codes(doc, "golden")).toContain("variant_not_available");
    expect(codes(doc, "liora")).not.toContain("variant_not_available");
  });

  it("reports variant_props_invalid", () => {
    const doc = document({
      sections: [{ id: "hero", variantId: "hero.bleed", major: 1, props: {} }],
    });
    expect(codes(doc)).toContain("variant_props_invalid");
  });

  it("reports token_missing for an empty color", () => {
    const doc = document();
    doc.tokens.color.background = "";
    expect(codes(doc)).toContain("token_missing");
  });

  it("puts a page section issue on pages.register.sections.<id>", () => {
    const doc = document({
      pages: {
        register: { sections: [{ id: "block", variantId: "hero.bleed", major: 9, props: {} }] },
      } as Partial<Record<ThemePageId, { sections: ThemeDocumentV1["sections"] }>>,
    });
    const result = validateThemeDocument(doc, "golden");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "variant_version_missing", path: "pages.register.sections.block" }),
    );
  });
});
