import { describe, expect, it } from "vitest";
import { extrasPackForTemplateKind } from "@/lib/register/packs/extrasPackForTemplateKind";
import { SITE_THEME_KINDS } from "@/types/theming";

describe("extrasPackForTemplateKind", () => {
  it("returns nago only for the nago template", () => {
    expect(extrasPackForTemplateKind("nago")).toBe("nago");
  });

  it("returns mozarthitos only for the mozarthitos template", () => {
    expect(extrasPackForTemplateKind("mozarthitos")).toBe("mozarthitos");
  });

  it("returns null for every other catalog kind", () => {
    for (const kind of SITE_THEME_KINDS) {
      if (kind === "nago" || kind === "mozarthitos") continue;
      expect(extrasPackForTemplateKind(kind)).toBeNull();
    }
  });

  it("returns null for unknown kinds", () => {
    expect(extrasPackForTemplateKind("brand-new-tenant")).toBeNull();
    expect(extrasPackForTemplateKind("")).toBeNull();
  });
});
