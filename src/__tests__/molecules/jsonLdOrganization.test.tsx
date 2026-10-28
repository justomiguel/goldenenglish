import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import type { BrandPublic } from "@/lib/brand/server";

const mockBase = vi.fn<() => string | null>();

vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: () => mockBase(),
}));

import { JsonLdOrganization } from "@/components/molecules/JsonLdOrganization";

describe("JsonLdOrganization", () => {
  const brandBase: BrandPublic = {
    name: "Org",
    legalName: "Org Legal",
    tagline: "T es",
    taglineEn: "T en",
    legalRegistry: "r",
    logoPath: "/logo.png",
    logoAlt: "A",
    faviconPath: "/f.ico",
    faviconBundlePrefix: null,
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    socialFacebook: "",
    socialInstagram: "",
    socialWhatsapp: "",
  };

  beforeEach(() => {
    mockBase.mockReturnValue("https://example.org");
  });

  it("returns null without public base URL", () => {
    mockBase.mockReturnValue(null);
    const { container } = render(
      <JsonLdOrganization locale="es" brand={brandBase} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("serializes JSON-LD with optional contact and sameAs", () => {
    mockBase.mockReturnValue("https://example.org");
    const brand: BrandPublic = {
      ...brandBase,
      contactEmail: "a@b.co",
      contactPhone: "+1",
      contactAddress: "Street 1",
      socialFacebook: "https://fb.example",
    };
    const { container } = render(
      <JsonLdOrganization locale="en" brand={brand} />,
    );
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

  it("omits placeholder phone, email, and address from JSON-LD", () => {
    mockBase.mockReturnValue("https://example.org");
    const brand: BrandPublic = {
      ...brandBase,
      contactEmail: "hola@tuestudio.cl",
      contactPhone: "+56 9 0000 0000",
      contactAddress: "Centro urbano — reemplaza con tu dirección",
    };
    const { container } = render(
      <JsonLdOrganization locale="es" brand={brand} />,
    );
    const script = container.querySelector("script[type='application/ld+json']");
    const json = JSON.parse(script!.textContent!);
    expect(json.email).toBeUndefined();
    expect(json.telephone).toBeUndefined();
    expect(json.address).toBeUndefined();
  });

  it("adds Liora department places without invented streets", () => {
    mockBase.mockReturnValue("https://example.org");
    const { container } = render(
      <JsonLdOrganization
        locale="es"
        brand={brandBase}
        templateKind="liora"
        places={[
          { name: "Providencia", description: "A pasos del Metro Parque Bustamante" },
          { name: "Maipú", description: "A pasos del Metro Plaza Maipú" },
          { name: "San Miguel", description: "A pasos del Metro San Miguel" },
        ]}
      />,
    );
    const script = container.querySelector("script[type='application/ld+json']");
    const json = JSON.parse(script!.textContent!);
    expect(json.department).toHaveLength(3);
    expect(json.department[0]).toMatchObject({
      "@type": "Place",
      name: "Providencia",
    });
    expect(JSON.stringify(json.department)).not.toMatch(/streetAddress/);
  });
});
