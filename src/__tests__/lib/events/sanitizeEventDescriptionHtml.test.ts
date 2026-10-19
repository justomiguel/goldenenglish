import { describe, expect, it } from "vitest";
import { sanitizeEventDescriptionHtml } from "@/lib/events/sanitizeEventDescriptionHtml";

describe("sanitizeEventDescriptionHtml", () => {
  it("strips script tags like blog sanitizer", () => {
    const out = sanitizeEventDescriptionHtml('<p>Hello</p><script>alert(1)</script>');
    expect(out).toContain("Hello");
    expect(out).not.toContain("script");
  });

  it("keeps an https image in the description", () => {
    const out = sanitizeEventDescriptionHtml(
      '<p><img src="https://example.supabase.co/storage/v1/object/public/event-media/foto.png" alt="foto" /></p>',
    );
    expect(out).toContain("foto.png");
  });
});
