// REGRESSION CHECK: TipTap YouTube nodes use a wrapper div; sanitizer must keep it so embeds round-trip.
import { describe, expect, it } from "vitest";
import { sanitizeLearningTaskHtml } from "@/lib/learning-tasks/sanitizeLearningTaskHtml";

describe("sanitizeLearningTaskHtml", () => {
  it("preserves TipTap YouTube wrapper and iframe", () => {
    const input =
      '<div data-youtube-video=""><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" width="720" height="405"></iframe></div>';
    const out = sanitizeLearningTaskHtml(input);
    expect(out).toContain("data-youtube-video");
    expect(out).toContain("youtube-nocookie.com/embed");
    expect(out).toContain("<iframe");
  });

  it("strips unsafe attributes from div wrappers", () => {
    const input =
      '<div onclick="evil()" data-youtube-video=""><iframe src="https://www.youtube-nocookie.com/embed/x" width="1" height="1"></iframe></div>';
    const out = sanitizeLearningTaskHtml(input);
    expect(out).not.toContain("onclick");
    expect(out).toContain("data-youtube-video");
  });
});
