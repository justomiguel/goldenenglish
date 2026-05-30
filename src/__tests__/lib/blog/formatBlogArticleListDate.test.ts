import { describe, expect, it } from "vitest";
import {
  formatBlogArticleListDate,
  formatBlogArticleViewCountLabel,
  resolveBlogArticleListIsoDate,
} from "@/lib/blog/formatBlogArticleListDate";

describe("formatBlogArticleListDate", () => {
  it("prefers publishedAt over createdAt", () => {
    expect(
      resolveBlogArticleListIsoDate({
        publishedAt: "2026-05-01T12:00:00.000Z",
        createdAt: "2026-04-01T12:00:00.000Z",
      }),
    ).toBe("2026-05-01T12:00:00.000Z");
  });

  it("formats with locale", () => {
    const formatted = formatBlogArticleListDate(
      { publishedAt: "2026-05-15T12:00:00.000Z", createdAt: "2026-04-01T12:00:00.000Z" },
      "es",
    );
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("interpolates view count in template", () => {
    expect(formatBlogArticleViewCountLabel(1200, "en", "{{count}} views")).toBe("1,200 views");
  });
});
