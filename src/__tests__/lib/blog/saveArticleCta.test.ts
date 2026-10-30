import { describe, expect, it } from "vitest";
import { normalizeArticleWrite } from "@/lib/blog/normalizeArticleWrite";

describe("normalizeArticleWrite", () => {
  it("returns snake fields for a complete call to action", () => {
    const result = normalizeArticleWrite({
      visibility: "members",
      commentsEnabled: false,
      ctaLabel: "Inscripción",
      ctaUrl: "/register",
    });
    expect(result).toEqual({
      ok: true,
      visibility: "members",
      comments_enabled: false,
      cta_label: "Inscripción",
      cta_url: "/register",
    });
  });

  it("rejects a label without a url", () => {
    const result = normalizeArticleWrite({
      visibility: "public",
      commentsEnabled: true,
      ctaLabel: "Inscripción",
      ctaUrl: "",
    });
    expect(result).toEqual({ ok: false, code: "cta_incomplete" });
  });
});
