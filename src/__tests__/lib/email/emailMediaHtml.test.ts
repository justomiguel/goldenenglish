/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { emailImageHtml, emailVideoLinkHtml } from "@/lib/email/emailMediaHtml";

describe("emailMediaHtml", () => {
  it("builds an https image and rejects other sources", () => {
    expect(emailImageHtml({ src: "https://cdn.example/a.png", alt: `A<"x">` })).toBe(
      '<img src="https://cdn.example/a.png" alt="A&lt;&quot;x&quot;&gt;" />',
    );
    expect(emailImageHtml({ src: "data:image/png;base64,aaa", alt: "x" })).toBeNull();
    expect(emailImageHtml({ src: "http://cdn.example/a.png", alt: "x" })).toBeNull();
    expect(emailImageHtml({ src: "javascript:alert(1)", alt: "x" })).toBeNull();
  });

  it("turns a YouTube URL into a thumbnail link and never an iframe", () => {
    const html = emailVideoLinkHtml("https://youtu.be/dQw4w9WgXcQ", { label: "Ver el video" });
    expect(html).toContain('href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"');
    expect(html).toContain('src="https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"');
    expect(html).toContain("Ver el video");
    expect(html).not.toContain("iframe");
    expect(html).not.toContain("/embed/");
  });

  it("turns a Vimeo URL into a text link", () => {
    const html = emailVideoLinkHtml("https://vimeo.com/123456789", { label: "Ver el video" });
    expect(html).toContain('href="https://vimeo.com/123456789"');
    expect(html).toContain("Ver el video");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("iframe");
  });

  it("rejects hosts that are not YouTube or Vimeo", () => {
    expect(emailVideoLinkHtml("https://example.com/watch?v=abc", { label: "Video" })).toBeNull();
    expect(emailVideoLinkHtml("not a url", { label: "Video" })).toBeNull();
  });
});
