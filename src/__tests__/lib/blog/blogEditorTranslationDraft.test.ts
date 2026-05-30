import { describe, expect, it } from "vitest";
import {
  buildSavableBlogTranslations,
  createBlogEditorTranslationsMap,
  isBlogTranslationSavable,
  otherBlogLocales,
} from "@/lib/blog/blogEditorTranslationDraft";

describe("blogEditorTranslationDraft", () => {
  it("only saves locales with title and body", () => {
    const map = createBlogEditorTranslationsMap({
      es: { title: "Hola", excerpt: "", bodyHtml: "<p>Texto</p>" },
      en: { title: "", excerpt: "", bodyHtml: "<p></p>" },
    });
    const rows = buildSavableBlogTranslations(map);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.locale).toBe("es");
    expect(rows[0]?.slug).toBe("hola");
  });

  it("lists other locales for translate targets", () => {
    expect(otherBlogLocales("es")).toEqual(["en", "pt"]);
  });

  it("rejects empty body", () => {
    expect(isBlogTranslationSavable({ title: "T", excerpt: "", bodyHtml: "<p></p>" })).toBe(
      false,
    );
  });
});
