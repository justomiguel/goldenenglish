import { describe, expect, it } from "vitest";
import {
  applyMediaInsertToOtherEventDescriptions,
  applyMediaInsertToOtherLocaleBodies,
  insertRichEditorMediaAtBlockIndex,
} from "@/lib/learning-content/insertRichEditorMediaAtBlockIndex";

describe("insertRichEditorMediaAtBlockIndex", () => {
  const imageSnippet = '<p><img src="https://cdn.example/a.jpg" alt="Photo" /></p>';

  it("inserts inline image inside the target paragraph for every locale copy", () => {
    const body = "<p>Primer párrafo</p><p>Segundo</p>";
    const next = insertRichEditorMediaAtBlockIndex(body, 0, imageSnippet);
    expect(next).toContain("Primer párrafo");
    expect(next).toMatch(/<p>Primer párrafo<img[^>]+src="https:\/\/cdn\.example\/a\.jpg"/);
  });

  it("appends block media after the anchor block", () => {
    const body = "<p>Uno</p><p>Dos</p>";
    const snippet = '<p><a href="https://cdn.example/a.pdf">Doc</a></p>';
    const next = insertRichEditorMediaAtBlockIndex(body, 0, snippet);
    expect(next.indexOf("Uno")).toBeLessThan(next.indexOf("a.pdf"));
    expect(next.indexOf("a.pdf")).toBeLessThan(next.indexOf("Dos"));
  });

  it("returns insert html when body is empty", () => {
    expect(insertRichEditorMediaAtBlockIndex("", 0, "<p>new</p>")).toBe("<p>new</p>");
    expect(insertRichEditorMediaAtBlockIndex("<p></p>", 0, "<p>new</p>")).toBe("<p>new</p>");
  });
});

describe("applyMediaInsertToOtherLocaleBodies", () => {
  it("updates sibling locales but leaves the active locale unchanged", () => {
    const map = {
      es: { bodyHtml: "<p>es</p>" },
      en: { bodyHtml: "<p>en</p>" },
      pt: { bodyHtml: "<p>pt</p>" },
    } as const;

    const next = applyMediaInsertToOtherLocaleBodies(
      map,
      ["es", "en", "pt"],
      "es",
      0,
      '<p><img src="https://cdn.example/a.jpg" alt="Photo" /></p>',
    );

    expect(next.es.bodyHtml).toBe("<p>es</p>");
    expect(next.en.bodyHtml).toContain("https://cdn.example/a.jpg");
    expect(next.pt.bodyHtml).toContain("https://cdn.example/a.jpg");
  });

  it("preserves extra draft fields on sibling locales", () => {
    const map = {
      es: { title: "ES", excerpt: "a", bodyHtml: "<p>es</p>", materials: [] },
      en: { title: "EN", excerpt: "b", bodyHtml: "<p>en</p>", materials: [] },
    };

    const next = applyMediaInsertToOtherLocaleBodies(
      map,
      ["es", "en"],
      "es",
      0,
      "<p><audio controls></audio></p>",
    );

    expect(next.en.title).toBe("EN");
    expect(next.en.excerpt).toBe("b");
    expect(next.en.bodyHtml).toContain("<audio");
  });
});

describe("applyMediaInsertToOtherEventDescriptions", () => {
  it("preserves title and location when syncing description media", () => {
    const map = {
      es: { locale: "es" as const, title: "ES", description: "<p>es</p>", location: "Santiago" },
      en: { locale: "en" as const, title: "EN", description: "<p>en</p>", location: null },
    };

    const next = applyMediaInsertToOtherEventDescriptions(
      map,
      ["es", "en"],
      "es",
      0,
      "<p><video controls></video></p>",
    );

    expect(next.es.description).toBe("<p>es</p>");
    expect(next.en.title).toBe("EN");
    expect(next.en.location).toBeNull();
    expect(next.en.description).toContain("<video");
  });
});
