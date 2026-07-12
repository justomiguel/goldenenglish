import { describe, expect, it } from "vitest";
import {
  extractSiteContactVisitorNameFromPortalHtml,
  resolveSiteContactVisitorDisplayName,
} from "@/lib/messaging/siteContactVisitorDisplayName";

// REGRESSION CHECK: Inbox must show the visitor person name, not the synthetic site_contact profile.

describe("siteContactVisitorDisplayName", () => {
  it("prefers persisted column when non-empty", () => {
    expect(
      resolveSiteContactVisitorDisplayName({
        external_contact_display_name: "  Vargas, Justo  ",
        body_html: "<p><strong>Nombre</strong> Ignored</p><hr />",
      }),
    ).toBe("Vargas, Justo");
  });

  it("extracts name from first non-email meta line before hr", () => {
    const html =
      '<p><strong>Asunto</strong> Clases</p><p><strong>Nombre</strong> Juan Pérez</p><p><strong>Email</strong> juan@ex.com</p><hr /><p>Hola</p>';
    expect(extractSiteContactVisitorNameFromPortalHtml(html)).toBe("Juan Pérez");
  });

  it("falls back to HTML extract when column missing", () => {
    const html =
      '<p><strong>Full name</strong> Ana Legacy</p><p><strong>Email</strong> a@b.co</p><hr /><p>Hi</p>';
    expect(
      resolveSiteContactVisitorDisplayName({
        external_contact_display_name: null,
        body_html: html,
      }),
    ).toBe("Ana Legacy");
  });

  it("returns null when nothing usable", () => {
    expect(
      resolveSiteContactVisitorDisplayName({
        external_contact_display_name: "  ",
        body_html: "<p>no meta</p>",
      }),
    ).toBeNull();
  });
});
