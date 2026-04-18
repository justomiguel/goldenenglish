/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { wrapEmailHtml } from "@/lib/email/templates/wrapEmailHtml";
import type { BrandPublic } from "@/lib/brand/server";

const baseBrand: BrandPublic = {
  name: "Test Institute",
  legalName: "Test Institute LLC",
  tagline: "Aprende inglés",
  taglineEn: "Learn English",
  legalRegistry: "RIF-1234",
  logoPath: "/images/logo.png",
  logoAlt: "Test Institute logo",
  faviconPath: "/favicon_io/favicon.ico",
  contactEmail: "hello@test-institute.example",
  contactPhone: "+1 555 0100",
  contactAddress: "123 Main St, Caracas",
  socialFacebook: "",
  socialInstagram: "",
  socialWhatsapp: "",
};

describe("wrapEmailHtml", () => {
  it("includes the brand name and absolute logo in the header", () => {
    const html = wrapEmailHtml({
      brand: baseBrand,
      origin: "https://app.example.com",
      locale: "es",
      bodyHtml: "<p>Cuerpo del mensaje</p>",
    });

    expect(html).toContain("Test Institute");
    expect(html).toContain('alt="Test Institute logo"');
    expect(html).toContain('src="https://app.example.com/images/logo.png"');
    expect(html).toContain("<p>Cuerpo del mensaje</p>");
  });

  it("renders contact info and legal name in the footer", () => {
    const html = wrapEmailHtml({
      brand: baseBrand,
      origin: "https://app.example.com",
      locale: "es",
      bodyHtml: "x",
    });

    expect(html).toContain("Test Institute LLC");
    expect(html).toContain("hello@test-institute.example");
    expect(html).toContain("123 Main St, Caracas");
    expect(html).toContain("<strong>Contacto:</strong>");
    expect(html).toContain("<strong>Dirección:</strong>");
  });

  it("uses English footer labels when locale is 'en'", () => {
    const html = wrapEmailHtml({
      brand: baseBrand,
      origin: "https://app.example.com",
      locale: "en",
      bodyHtml: "x",
    });
    expect(html).toContain("<strong>Contact:</strong>");
    expect(html).toContain("<strong>Address:</strong>");
    expect(html).toContain('<html lang="en">');
  });

  it("escapes brand name to avoid HTML injection in title/header", () => {
    const html = wrapEmailHtml({
      brand: { ...baseBrand, name: '<script>alert("x")</script>' },
      origin: "https://app.example.com",
      locale: "es",
      bodyHtml: "x",
    });
    expect(html).not.toContain('<script>alert("x")</script>');
    expect(html).toContain("&lt;script&gt;");
  });

  it("keeps absolute logo URL when logoPath is already absolute", () => {
    const html = wrapEmailHtml({
      brand: { ...baseBrand, logoPath: "https://cdn.example.com/logo.png" },
      origin: "https://app.example.com",
      locale: "es",
      bodyHtml: "x",
    });
    expect(html).toContain('src="https://cdn.example.com/logo.png"');
  });

  it("omits empty footer lines when contact data is missing", () => {
    const html = wrapEmailHtml({
      brand: { ...baseBrand, contactEmail: "", contactAddress: "" },
      origin: "https://app.example.com",
      locale: "es",
      bodyHtml: "x",
    });
    expect(html).not.toContain("<strong>Contacto:</strong>");
    expect(html).not.toContain("<strong>Dirección:</strong>");
    expect(html).toContain("Test Institute LLC");
  });
});
