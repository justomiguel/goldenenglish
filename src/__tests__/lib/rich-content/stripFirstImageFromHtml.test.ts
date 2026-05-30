import { describe, expect, it } from "vitest";
import { stripFirstImageFromHtml } from "@/lib/rich-content/stripFirstImageFromHtml";

describe("stripFirstImageFromHtml", () => {
  it("removes a paragraph-wrapped first image", () => {
    const html =
      '<p><img src="https://cdn.example/cover.jpg" alt="Cover" /></p><p>Body text</p>';
    expect(stripFirstImageFromHtml(html)).toBe("<p>Body text</p>");
  });

  it("removes a bare first image tag", () => {
    const html = '<img src="https://cdn.example/cover.jpg" alt="Cover" /><p>Body</p>';
    expect(stripFirstImageFromHtml(html)).toBe("<p>Body</p>");
  });
});
