import { describe, expect, it } from "vitest";
import { extractFirstImageSrcFromHtml } from "@/lib/rich-content/extractFirstImageSrcFromHtml";
import {
  resolveBlogCoverImageUrl,
  resolveEventCoverImageUrl,
} from "@/lib/rich-content/resolvePublicContentCoverUrl";

describe("extractFirstImageSrcFromHtml", () => {
  it("returns the first img src in document order", () => {
    const html =
      '<p>Intro</p><p><img src="https://cdn.example/first.jpg" alt="A" /></p><img src="https://cdn.example/second.jpg" />';
    expect(extractFirstImageSrcFromHtml(html)).toBe("https://cdn.example/first.jpg");
  });

  it("ignores data URLs and empty html", () => {
    expect(extractFirstImageSrcFromHtml('<img src="data:image/png;base64,abc" />')).toBeNull();
    expect(extractFirstImageSrcFromHtml("")).toBeNull();
  });
});

describe("resolveEventCoverImageUrl", () => {
  it("reads from description html", () => {
    expect(
      resolveEventCoverImageUrl('<p>Text<img src="https://cdn.example/event.jpg" alt="E" /></p>'),
    ).toBe("https://cdn.example/event.jpg");
  });
});

describe("resolveBlogCoverImageUrl", () => {
  it("prefers the first inline body image for cards and social share", () => {
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    try {
      expect(
        resolveBlogCoverImageUrl(
          '<p><img src="https://cdn.example/body.jpg" /></p>',
          "articles/abc/cover.webp",
        ),
      ).toBe("https://cdn.example/body.jpg");
    } finally {
      process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    }
  });

  it("falls back to cover storage path when the body has no image", () => {
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    try {
      expect(
        resolveBlogCoverImageUrl("<p>Text only</p>", "articles/abc/cover.webp"),
      ).toBe(
        "https://project.supabase.co/storage/v1/object/public/blog-media/articles/abc/cover.webp",
      );
    } finally {
      process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    }
  });
});
