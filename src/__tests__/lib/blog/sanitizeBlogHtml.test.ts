import { describe, expect, it } from "vitest";
import { sanitizeBlogHtml } from "@/lib/blog/sanitizeBlogHtml";

describe("sanitizeBlogHtml", () => {
  it("removes scripts and inline handlers", () => {
    const input =
      '<p onclick="alert(1)">Hi</p><script>alert(1)</script><a href="javascript:alert(2)">x</a>';
    const out = sanitizeBlogHtml(input);
    expect(out).toContain("<p>Hi</p>");
    expect(out).not.toContain("script");
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("javascript:");
  });

  it("keeps audio and video tags with safe attributes", () => {
    const out = sanitizeBlogHtml(
      '<p><audio controls src="https://x.supabase.co/storage/v1/object/public/blog-media/a.mp3"></audio></p>',
    );
    expect(out).toContain("<audio");
    expect(out).toContain("controls");
  });

  it("keeps whitelisted iframe hosts", () => {
    const out = sanitizeBlogHtml(
      '<iframe src="https://www.youtube.com/embed/abc" title="video"></iframe>',
    );
    expect(out).toContain("youtube.com");
  });

  it("strips non-whitelisted iframe hosts", () => {
    const out = sanitizeBlogHtml(
      '<iframe src="https://evil.example.com/embed/abc" title="video"></iframe>',
    );
    expect(out).not.toContain("iframe");
  });
});
