import { describe, expect, it } from "vitest";
import { COLOR_TOKEN_KEYS, type DesignTokensV1 } from "@/lib/design-tokens/designTokensV1";
import { themeDocumentV1Schema, type ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";

function tokens(): DesignTokensV1 {
  const color = Object.fromEntries(COLOR_TOKEN_KEYS.map((key) => [key, "#112233"])) as DesignTokensV1["color"];
  return {
    version: 1,
    color,
    font: { heading: "fraunces", body: "dm-sans" },
    type: { scale: "standard", headingWeight: 600 },
    radius: { control: "0.75rem", card: "0.75rem" },
    space: { density: "standard" },
    shadow: { soft: "none", card: "none" },
    motion: { level: "subtle" },
  };
}

function document(patch: Partial<ThemeDocumentV1> = {}): ThemeDocumentV1 {
  return {
    contractVersion: 1,
    tokens: tokens(),
    fontIds: { heading: "fraunces", body: "dm-sans" },
    sections: [],
    pages: {},
    editableBy: {},
    ...patch,
  };
}

describe("themeDocumentV1Schema", () => {
  it("parses a minimal document", () => {
    expect(themeDocumentV1Schema.safeParse(document()).success).toBe(true);
  });

  it("rejects an unknown page id", () => {
    const raw = { ...document(), pages: { nope: { sections: [] } } };
    expect(themeDocumentV1Schema.safeParse(raw).success).toBe(false);
  });

  it("rejects duplicate section ids", () => {
    const section = { id: "hero", variantId: "hero.bleed", major: 1, props: {} };
    expect(themeDocumentV1Schema.safeParse(document({ sections: [section, section] })).success).toBe(false);
  });

  it("rejects an editableBy value outside staff and admin", () => {
    const raw = { ...document(), editableBy: { "tokens.color.primary": "owner" } };
    expect(themeDocumentV1Schema.safeParse(raw).success).toBe(false);
  });
});
