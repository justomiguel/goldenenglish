import { describe, expect, it } from "vitest";
import {
  extractSiteContactVisitorEmailFromPortalHtml,
  resolveSiteContactVisitorReplyEmail,
} from "@/lib/messaging/siteContactVisitorReplyEmail";

describe("siteContactVisitorReplyEmail", () => {
  it("prefers persisted column when valid", () => {
    const email = resolveSiteContactVisitorReplyEmail({
      external_contact_reply_email: " saved@test.example ",
      body_html: "<p>ignored</p>",
    });
    expect(email).toBe("saved@test.example");
  });

  it("extracts email from legacy HTML header before hr", () => {
    const html =
      '<p><strong>Subject</strong> Other</p><p><strong>Email</strong> visitor@site.example</p><hr /><p>Hello</p>';
    expect(extractSiteContactVisitorEmailFromPortalHtml(html)).toBe("visitor@site.example");
  });

  it("falls back to body extraction when column missing", () => {
    const html =
      '<p><strong>Correo</strong> fallback@legacy.example</p><hr /><p>Body</p>';
    expect(
      resolveSiteContactVisitorReplyEmail({
        external_contact_reply_email: null,
        body_html: html,
      }),
    ).toBe("fallback@legacy.example");
  });
});
