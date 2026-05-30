import { describe, expect, it } from "vitest";
import { resolveBlogEmbedDisplay } from "@/lib/blog/resolveBlogEmbedIframeSrc";

describe("resolveBlogEmbedDisplay", () => {
  it("maps YouTube watch URLs to video embed mode", () => {
    const result = resolveBlogEmbedDisplay("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(result).toEqual({
      mode: "video",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    });
  });

  it("uses iframe mode for HTTPS form embed URLs", () => {
    const url = "https://docs.google.com/forms/d/e/1FAIpQLSexample/viewform?embedded=true";
    expect(resolveBlogEmbedDisplay(url)).toEqual({ mode: "iframe", embedUrl: url });
  });

  it("falls back to external link for non-HTTPS URLs", () => {
    expect(resolveBlogEmbedDisplay("http://example.com/form")).toEqual({
      mode: "link",
      href: "http://example.com/form",
    });
  });

  it("falls back to link for invalid URLs", () => {
    expect(resolveBlogEmbedDisplay("not-a-url")).toEqual({ mode: "link", href: "not-a-url" });
  });
});
