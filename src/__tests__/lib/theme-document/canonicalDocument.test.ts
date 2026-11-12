import { describe, expect, it } from "vitest";
import {
  THEME_DOCUMENT_MAX_BYTES,
  canonicalDocumentJson,
  documentHash,
  isDocumentTooLarge,
} from "@/lib/theme-document/canonicalDocument";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";

const base = {
  contractVersion: 1,
  tokens: { version: 1 },
  fontIds: { heading: "fraunces", body: "dm-sans" },
  sections: [{ id: "hero", variantId: "hero.bleed", major: 1, props: { title: "North" } }],
  pages: {},
  editableBy: { "fontIds.heading": "staff", "sections.order": "admin" },
} as ThemeDocumentV1;

describe("canonical theme document", () => {
  it("keeps the same hash when key order changes", async () => {
    const flipped = {
      editableBy: { "sections.order": "admin", "fontIds.heading": "staff" },
      pages: {},
      sections: base.sections,
      fontIds: { body: "dm-sans", heading: "fraunces" },
      tokens: { version: 1 },
      contractVersion: 1,
    } as ThemeDocumentV1;
    expect(canonicalDocumentJson(flipped)).toBe(canonicalDocumentJson(base));
    expect(await documentHash(flipped)).toBe(await documentHash(base));
  });

  it("changes the hash when a prop changes", async () => {
    const next = {
      ...base,
      sections: [{ id: "hero", variantId: "hero.bleed", major: 1, props: { title: "South" } }],
    } as ThemeDocumentV1;
    expect(await documentHash(next)).not.toBe(await documentHash(base));
  });

  it("reports a document over the byte cap", () => {
    const huge = {
      ...base,
      sections: [{ id: "hero", variantId: "hero.bleed", major: 1, props: { blob: "x".repeat(THEME_DOCUMENT_MAX_BYTES) } }],
    } as ThemeDocumentV1;
    expect(isDocumentTooLarge(huge)).toBe(true);
    expect(isDocumentTooLarge(base)).toBe(false);
  });
});
