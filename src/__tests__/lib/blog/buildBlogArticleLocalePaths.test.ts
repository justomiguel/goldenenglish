import { describe, expect, it } from "vitest";
import {
  buildBlogArticleLanguageAlternates,
  buildBlogArticleLocalePaths,
} from "@/lib/blog/buildBlogArticleLocalePaths";
import { resolveArticleIdFromSlugMatches } from "@/lib/blog/resolveArticleIdFromSlugMatches";

describe("resolveArticleIdFromSlugMatches", () => {
  it("returns the sole article id when slug is unique", () => {
    expect(
      resolveArticleIdFromSlugMatches(
        [{ article_id: "a1", locale: "es" }],
        "en",
      ),
    ).toBe("a1");
  });

  it("prefers the slug owner in another locale after a language switch", () => {
    expect(
      resolveArticleIdFromSlugMatches(
        [
          { article_id: "article-1", locale: "es" },
          { article_id: "article-2", locale: "en" },
        ],
        "en",
      ),
    ).toBe("article-1");
  });
});

describe("buildBlogArticleLocalePaths", () => {
  it("builds per-locale blog detail paths from translation slugs", () => {
    expect(
      buildBlogArticleLocalePaths({
        es: "mi-articulo",
        en: "my-article",
      }),
    ).toEqual({
      es: "/es/blog/mi-articulo",
      en: "/en/blog/my-article",
    });
  });
});

describe("buildBlogArticleLanguageAlternates", () => {
  it("includes x-default from the article default locale", () => {
    expect(
      buildBlogArticleLanguageAlternates(
        { es: "mi-articulo", en: "my-article" },
        "es",
      ),
    ).toEqual({
      es: "/es/blog/mi-articulo",
      en: "/en/blog/my-article",
      "x-default": "/es/blog/mi-articulo",
    });
  });
});
