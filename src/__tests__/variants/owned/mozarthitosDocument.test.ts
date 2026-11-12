import { describe, expect, it } from "vitest";
import { validateThemeDocument } from "@/lib/theme-document/validateThemeDocument";
import { document } from "@/variants/owned/mozarthitos/document";

describe("mozarthitos theme document", () => {
  it("validates for the mozarthitos tenant", () => {
    expect(validateThemeDocument(document, "mozarthitos")).toEqual({ ok: true });
  });

  it("keeps home as one page variant and the class guide on findClass", () => {
    expect(document.pages.home?.sections.map((item) => item.variantId)).toEqual(["page.mozarthitos-home"]);
    expect(document.pages.findClass?.sections.map((item) => item.variantId)).toEqual(["page.find-class"]);
  });

  it("rejects the same document for another tenant", () => {
    const result = validateThemeDocument(document, "liora");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.code).toBe("variant_not_available");
    }
  });
});
