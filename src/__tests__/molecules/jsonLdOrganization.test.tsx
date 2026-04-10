import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import type { BrandPublic } from "@/lib/brand/server";

const mockBase = vi.fn<() => string | null>();
const mockBrand = vi.fn<() => BrandPublic>();

vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: () => mockBase(),
}));

vi.mock("@/lib/brand/server", () => ({
  getBrandPublic: () => mockBrand(),
}));

import { JsonLdOrganization } from "@/components/molecules/JsonLdOrganization";

describe("JsonLdOrganization", () => {
  beforeEach(() => {
    mockBase.mockReturnValue("https://example.org");
    mockBrand.mockReturnValue({
      name: "Org",
      legalName: "Org Legal",
      tagline: "T es",
      taglineEn: "T en",
      legalRegistry: "r",
      logoPath: "/logo.png",
      logoAlt: "A",
      faviconPath: "/f.ico",
      contactEmail: "",
      contactPhone: "",
      contactAddress: "",
      socialFacebook: "",
      socialInstagram: "",
      socialWhatsapp: "",
    });
  });

  it("returns null without public base URL", () => {
    mockBase.mockReturnValue(null);
    const { container } = render(<JsonLdOrganization locale="es" />);
    expect(container.firstChild).toBeNull();
  });

  it("serializes JSON-LD with optional contact and sameAs", () => {
    mockBrand.mockReturnValue({
      name: "Org",
      legalName: "Org Legal",
      tagline: "T es",
      taglineEn: "T en",
      legalRegistry: "r",
      logoPath: "/logo.png",
      logoAlt: "A",
      faviconPath: "/f.ico",
      contactEmail: "a@b.co",
      contactPhone: "+1",
      contactAddress: "Street 1",
      socialFacebook: "https://fb.example",
      socialInstagram: "",
      socialWhatsapp: "",
    });
    const { container } = render(<JsonLdOrganization locale="en" />);
    const script = container.querySelector("script[type='application/ld+json']");
    expect(script?.textContent).toBeTruthy();
    const json = JSON.parse(script!.textContent!);
    expect(json.email).toBe("a@b.co");
    expect(json.telephone).toBe("+1");
    expect(json.address).toMatchObject({
      "@type": "PostalAddress",
      streetAddress: "Street 1",
    });
    expect(json.sameAs).toEqual(["https://fb.example"]);
  });
});
