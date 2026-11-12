import { describe, expect, it } from "vitest";
import { legacyThemeToDocument } from "@/lib/theme-document/legacyThemeToDocument";
import { pickEditorDocument } from "@/lib/theme-document/pickEditorDocument";

const legacy = legacyThemeToDocument({
  properties: {},
  skin_content: null,
  template_kind: "classic",
});

describe("pickEditorDocument", () => {
  it("uses the draft and its hash when the draft parses", () => {
    const picked = pickEditorDocument({
      draft: { document: legacy, documentHash: "abc" },
      published: null,
      legacy,
    });
    expect(picked.baseHash).toBe("abc");
    expect(picked.document).toEqual(legacy);
  });

  it("shows the published document with a null hash when no draft parses", () => {
    const picked = pickEditorDocument({
      draft: { document: { contractVersion: 0 }, documentHash: "stale" },
      published: legacy,
      legacy,
    });
    expect(picked.baseHash).toBeNull();
    expect(picked.document).toEqual(legacy);
  });

  it("falls back to the legacy document", () => {
    const picked = pickEditorDocument({ draft: null, published: null, legacy });
    expect(picked).toEqual({ document: legacy, baseHash: null });
  });
});
