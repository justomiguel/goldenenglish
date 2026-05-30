import { describe, expect, it } from "vitest";
import { sanitizeEventDescriptionHtml } from "@/lib/events/sanitizeEventDescriptionHtml";

describe("sanitizeEventDescriptionHtml", () => {
  it("strips script tags like blog sanitizer", () => {
    const out = sanitizeEventDescriptionHtml('<p>Hello</p><script>alert(1)</script>');
    expect(out).toContain("Hello");
    expect(out).not.toContain("script");
  });
});
