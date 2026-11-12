import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { documentIndexedPaths, withFindClassPage } from "@/lib/site/documentIndexedPaths";
import { legacyThemeToDocument } from "@/lib/theme-document/legacyThemeToDocument";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";

const sitemapSource = readFileSync(path.join(process.cwd(), "src/app/sitemap.ts"), "utf8");

function document(pages: ThemeDocumentV1["pages"]): ThemeDocumentV1 {
  const base = legacyThemeToDocument({
    properties: {},
    skin_content: null,
    template_kind: "classic",
  });
  return { ...base, pages };
}

describe("documentIndexedPaths", () => {
  it("lists a path only when that page exists", () => {
    expect(documentIndexedPaths(null)).toEqual([]);
    expect(documentIndexedPaths(document({}))).toEqual([]);
    expect(
      documentIndexedPaths(document({ findClass: { sections: [{ id: "guide", variantId: "page.find-class", major: 1, props: {} }] } })),
    ).toEqual(["/encuentra-tu-clase"]);
    expect(documentIndexedPaths(document({ events: { sections: [] } }))).toEqual(["/eventos"]);
    expect(documentIndexedPaths(document({ blog: { sections: [] } }))).toEqual(["/blog"]);
  });

  it("keeps the sitemap free of a tenant key", () => {
    expect(sitemapSource).not.toContain("TEMPLATE_INDEXED_PATHS");
    expect(sitemapSource.toLowerCase()).not.toContain("mozarthitos");
  });

  it("adds the find-class page without dropping the rest of the document", () => {
    const base = document({});
    const next = withFindClassPage(base);
    expect(next.pages.findClass?.sections[0]?.id).toBe("guide");
    expect(withFindClassPage(next)).toBe(next);
  });
});
