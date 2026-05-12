/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/brand/server", () => ({
  getBrandForRequest: vi.fn(),
}));

vi.mock("@/lib/theme/loadEffectiveProperties", () => ({
  loadEffectiveProperties: vi.fn(),
}));

vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: vi.fn(),
}));

import { loadReceiptBrandForRequest } from "@/lib/billing/loadReceiptBrandForRequest";
import { getBrandForRequest } from "@/lib/brand/server";
import type { BrandPublic } from "@/lib/brand/server";
import { loadEffectiveProperties } from "@/lib/theme/loadEffectiveProperties";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";

function brandFixture(overrides: Partial<BrandPublic> = {}): BrandPublic {
  return {
    name: "Tenant",
    legalName: "Tenant Legal",
    tagline: "",
    taglineEn: "",
    legalRegistry: "RUT 1",
    logoPath: "/logo.png",
    logoAlt: "Logo",
    faviconPath: "/favicon.ico",
    faviconBundlePrefix: null,
    contactAddress: "Addr",
    contactEmail: "x@y.z",
    contactPhone: "+1",
    socialFacebook: "",
    socialInstagram: "",
    socialWhatsapp: "",
    ...overrides,
  };
}

describe("loadReceiptBrandForRequest", () => {
  beforeEach(() => {
    vi.mocked(getPublicSiteUrl).mockReturnValue(new URL("https://tenant.example/"));
    vi.mocked(getBrandForRequest).mockResolvedValue(brandFixture());
    vi.mocked(loadEffectiveProperties).mockResolvedValue({
      properties: { "color.primary": "not-a-hex" },
      activeThemeSlug: null,
    });
  });

  it("builds absolute logo from site origin and falls back primary color when invalid", async () => {
    const b = await loadReceiptBrandForRequest();
    expect(b.logoUrl).toBe("https://tenant.example/logo.png");
    expect(b.primaryColor).toBe("#103A5C");
    expect(b.legalName).toBe("Tenant Legal");
  });

  it("keeps absolute logo URLs and uses valid primary from theme", async () => {
    vi.mocked(getBrandForRequest).mockResolvedValue(
      brandFixture({
        legalRegistry: "",
        logoPath: "https://cdn.example/i.png",
        contactAddress: "",
        contactEmail: "",
        contactPhone: "",
      }),
    );
    vi.mocked(loadEffectiveProperties).mockResolvedValue({
      properties: { "color.primary": "#AABBCC" },
      activeThemeSlug: "t",
    });

    const b = await loadReceiptBrandForRequest();
    expect(b.logoUrl).toBe("https://cdn.example/i.png");
    expect(b.primaryColor).toBe("#AABBCC");
  });

  it("uses localhost when public URL is null", async () => {
    vi.mocked(getPublicSiteUrl).mockReturnValue(null);
    vi.mocked(getBrandForRequest).mockResolvedValue(
      brandFixture({
        name: "T",
        legalName: "L",
        legalRegistry: "",
        logoPath: "rel/logo.svg",
        contactAddress: "",
        contactEmail: "",
        contactPhone: "",
      }),
    );

    const b = await loadReceiptBrandForRequest();
    expect(b.logoUrl).toBe("http://localhost:3000/rel/logo.svg");
  });

  it("accepts data: URLs and relative paths without leading slash for logo", async () => {
    vi.mocked(getBrandForRequest).mockResolvedValue(
      brandFixture({
        logoPath: "data:image/png;base64,QUJD",
      }),
    );
    let b = await loadReceiptBrandForRequest();
    expect(b.logoUrl).toBe("data:image/png;base64,QUJD");

    vi.mocked(getBrandForRequest).mockResolvedValue(
      brandFixture({
        logoPath: "assets/logo.png",
      }),
    );
    b = await loadReceiptBrandForRequest();
    expect(b.logoUrl).toBe("https://tenant.example/assets/logo.png");
  });
});
