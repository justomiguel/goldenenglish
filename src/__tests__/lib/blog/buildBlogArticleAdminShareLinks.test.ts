import { describe, expect, it } from "vitest";
import { buildBlogArticleAdminShareLinkPaths } from "@/lib/blog/buildBlogArticleAdminShareLinks";

describe("buildBlogArticleAdminShareLinkPaths", () => {
  it("returns public paths per locale when published", () => {
    const paths = buildBlogArticleAdminShareLinkPaths({
      articleId: "article-1",
      status: "published",
      slugsByLocale: { es: "mi-articulo", en: "my-post" },
    });

    expect(paths).toEqual([
      { locale: "en", pathname: "/en/blog/my-post", kind: "public" },
      { locale: "es", pathname: "/es/blog/mi-articulo", kind: "public" },
    ]);
  });

  it("returns preview paths for draft locales when preview token exists", () => {
    const paths = buildBlogArticleAdminShareLinkPaths({
      articleId: "article-1",
      status: "draft",
      slugsByLocale: { es: "borrador", en: "draft-post" },
      previewToken: "signed-token",
    });

    expect(paths).toEqual([
      { locale: "en", pathname: "/en/blog/preview/signed-token", kind: "preview" },
      { locale: "es", pathname: "/es/blog/preview/signed-token", kind: "preview" },
    ]);
  });

  it("returns no preview paths when token is missing", () => {
    const paths = buildBlogArticleAdminShareLinkPaths({
      articleId: "article-1",
      status: "draft",
      slugsByLocale: { es: "borrador" },
      previewToken: null,
    });

    expect(paths).toEqual([]);
  });
});
