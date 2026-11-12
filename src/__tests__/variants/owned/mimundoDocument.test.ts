import { describe, expect, it } from "vitest";
import { validateThemeDocument } from "@/lib/theme-document/validateThemeDocument";
import { document } from "@/variants/owned/mimundo/document";

describe("mimundo theme document", () => {
  it("validates for the mimundo tenant", () => {
    expect(validateThemeDocument(document, "mimundo")).toEqual({ ok: true });
  });

  it("keeps home as one page variant", () => {
    expect(document.pages.home?.sections.map((item) => item.variantId)).toEqual(["page.mimundo-home"]);
  });

  it("rejects the same document for another tenant", () => {
    const result = validateThemeDocument(document, "liora");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.code).toBe("variant_not_available");
    }
  });
});
