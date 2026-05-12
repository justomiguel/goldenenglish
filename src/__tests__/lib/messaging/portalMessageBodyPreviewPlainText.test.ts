import { describe, expect, it } from "vitest";
import { buildPublicSiteContactMessageHtml } from "@/lib/messaging/buildPublicSiteContactMessageHtml";
import { portalMessageBodyPreviewPlainText } from "@/lib/messaging/portalMessageBodyPreviewPlainText";

describe("portalMessageBodyPreviewPlainText", () => {
  it("uses only content after the first hr for public-site contact HTML", () => {
    const html = buildPublicSiteContactMessageHtml({
      subjectFieldLabel: "Subject",
      subjectLabel: "Sales",
      metaLines: [{ label: "Name", value: "Ada" }],
      bodyPlain: "Hello team.\n\nThanks.",
    });
    const preview = portalMessageBodyPreviewPlainText(html, 500);
    expect(preview).not.toMatch(/Subject/i);
    expect(preview).not.toMatch(/Sales/);
    expect(preview).not.toMatch(/Ada/);
    expect(preview).toContain("Hello team");
    expect(preview).toContain("Thanks");
  });

  it("falls back to full HTML when there is no hr", () => {
    expect(portalMessageBodyPreviewPlainText("<p>Plain note</p>", 80)).toBe("Plain note");
  });

  it("truncates long body with ellipsis", () => {
    const long = "x".repeat(100);
    expect(portalMessageBodyPreviewPlainText(`<p>${long}</p>`, 40)).toBe(`${"x".repeat(40)}…`);
  });
});
