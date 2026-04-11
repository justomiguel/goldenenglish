/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";

describe("sanitizeMessageHtml", () => {
  it("strips script tags", () => {
    const out = sanitizeMessageHtml("<p>Hi</p><script>alert(1)</script>");
    expect(out).not.toMatch(/script/i);
    expect(out).toContain("Hi");
  });

  it("strips event handlers and disallowed tags", () => {
    const out = sanitizeMessageHtml(
      '<p onclick="x">a</p><iframe src="y"></iframe><img src="z" onerror="e">',
    );
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("iframe");
    expect(out).not.toContain("onerror");
  });

  it("keeps StarterKit-like tags", () => {
    const out = sanitizeMessageHtml("<p><strong>b</strong></p><ul><li>x</li></ul>");
    expect(out).toContain("strong");
    expect(out).toContain("ul");
  });
});
