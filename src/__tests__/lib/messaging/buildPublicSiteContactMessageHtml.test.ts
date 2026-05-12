// REGRESSION CHECK: HTML builder must escape PII text and keep only safe tags after sanitize.
import { describe, expect, it } from "vitest";
import { buildPublicSiteContactMessageHtml } from "@/lib/messaging/buildPublicSiteContactMessageHtml";

describe("buildPublicSiteContactMessageHtml", () => {
  it("includes subject and meta lines and strips script injection", () => {
    const html = buildPublicSiteContactMessageHtml({
      subjectFieldLabel: "Subject",
      subjectLabel: "Prices",
      metaLines: [
        { label: "Name", value: "Ada <script>x</script>" },
        { label: "Email", value: "a@b.co" },
        { label: "Phone", value: "" },
      ],
      bodyPlain: "Hello\n\nWorld",
    });
    expect(html).toContain("Ada &lt;script&gt;x&lt;/script&gt;");
    expect(html).not.toContain("<script");
    expect(html).toContain("<strong>Subject</strong>");
    expect(html).toContain("Prices");
    expect(html).toContain("Hello");
    expect(html).toContain("World");
  });
});
