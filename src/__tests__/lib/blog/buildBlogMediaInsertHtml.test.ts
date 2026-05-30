import { describe, expect, it } from "vitest";
import { buildBlogMediaInsertHtml, buildBlogYoutubeInsertHtml } from "@/lib/blog/buildBlogMediaInsertHtml";

describe("buildBlogMediaInsertHtml", () => {
  it("inserts audio element for audio mime", () => {
    const html = buildBlogMediaInsertHtml({
      url: "https://cdn.example.com/a.mp3",
      label: "Podcast",
      contentType: "audio/mpeg",
    });
    expect(html).toContain("<audio");
    expect(html).toContain("controls");
  });

  it("inserts link for pdf", () => {
    const html = buildBlogMediaInsertHtml({
      url: "https://cdn.example.com/doc.pdf",
      label: "Guía PDF",
      contentType: "application/pdf",
    });
    expect(html).toContain("<a ");
    expect(html).toContain("Guía PDF");
  });

  it("inserts image element for image mime", () => {
    const html = buildBlogMediaInsertHtml({
      url: "https://cdn.example.com/photo.jpg",
      label: "Cover",
      contentType: "image/jpeg",
    });
    expect(html).toContain('<img src="https://cdn.example.com/photo.jpg"');
    expect(html).toContain('alt="Cover"');
  });

  it("inserts video element for video mime", () => {
    const html = buildBlogMediaInsertHtml({
      url: "https://cdn.example.com/clip.mp4",
      label: "Clip",
      contentType: "video/mp4",
    });
    expect(html).toContain("<video");
    expect(html).toContain("controls");
  });
});

describe("buildBlogYoutubeInsertHtml", () => {
  it("returns embed iframe for watch URLs", () => {
    const html = buildBlogYoutubeInsertHtml("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(html).not.toBeNull();
    expect(html).toContain("data-youtube-video");
    expect(html).toContain("youtube-nocookie.com/embed");
  });

  it("returns null for invalid URLs", () => {
    expect(buildBlogYoutubeInsertHtml("https://example.com/not-youtube")).toBeNull();
  });
});
