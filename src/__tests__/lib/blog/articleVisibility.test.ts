// REGRESSION CHECK: Blog visibility, guest comments, and 30-day rates must stay aligned with the 2026-10-28 spec.
// REGRESSION CHECK: Anonymous members articles redirect to login with the article path. Public and signed-in reads stay on the article.
import { describe, expect, it } from "vitest";
import { canReadBlogArticle, membersArticleRedirectPath } from "@/lib/blog/articleVisibility";

describe("canReadBlogArticle", () => {
  it("hides members articles from anonymous readers", () => {
    expect(canReadBlogArticle({ visibility: "members", isSignedIn: false })).toBe(false);
  });

  it("shows members articles to signed-in readers", () => {
    expect(canReadBlogArticle({ visibility: "members", isSignedIn: true })).toBe(true);
  });

  it("shows public articles to anonymous and signed-in readers", () => {
    expect(canReadBlogArticle({ visibility: "public", isSignedIn: false })).toBe(true);
    expect(canReadBlogArticle({ visibility: "public", isSignedIn: true })).toBe(true);
  });
});

describe("membersArticleRedirectPath", () => {
  it("sends an anonymous members article to login with the article path", () => {
    expect(
      membersArticleRedirectPath({
        locale: "es",
        slug: "marzo",
        visibility: "members",
        isSignedIn: false,
      }),
    ).toBe("/es/login?next=%2Fes%2Fblog%2Fmarzo");
  });

  it("returns null for a public article", () => {
    expect(
      membersArticleRedirectPath({
        locale: "es",
        slug: "marzo",
        visibility: "public",
        isSignedIn: false,
      }),
    ).toBeNull();
  });

  it("returns null for a signed-in members article", () => {
    expect(
      membersArticleRedirectPath({
        locale: "es",
        slug: "marzo",
        visibility: "members",
        isSignedIn: true,
      }),
    ).toBeNull();
  });
});
