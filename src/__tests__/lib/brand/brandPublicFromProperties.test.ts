import { describe, it, expect } from "vitest";
import { brandPublicFromProperties } from "@/lib/brand/server";

// REGRESSION CHECK: brandPublicFromProperties must stay pure (no fs / Supabase),
// because it's called inside an unstable_cache path in src/app/layout.tsx.
// Defaults must be preserved when keys are missing so the landing keeps
// rendering even with an empty active theme override map.

describe("brandPublicFromProperties (pure)", () => {
  it("derives every public field from the property map", () => {
    const brand = brandPublicFromProperties({
      "app.name": "Golden English",
      "app.legal.name": "Instituto Golden English",
      "app.tagline": "Más de 20 años",
      "app.tagline.en": "Over 20 years",
      "app.legal.registry": "Resolución 1297/05",
      "app.logo.path": "/images/logo.png",
      "app.logo.alt": "Logo GE",
      "app.favicon.path": "/favicon_io/favicon.ico",
      "contact.email": "info@example.com",
      "contact.phone": "+54 9 0000 000-000",
      "contact.address": "Formosa, Argentina",
      "social.facebook": "https://facebook.com/x",
      "social.instagram": "https://instagram.com/x",
      "social.whatsapp": "https://wa.me/0000",
    });
    expect(brand).toEqual({
      name: "Golden English",
      legalName: "Instituto Golden English",
      tagline: "Más de 20 años",
      taglineEn: "Over 20 years",
      legalRegistry: "Resolución 1297/05",
      logoPath: "/images/logo.png",
      logoAlt: "Logo GE",
      faviconPath: "/favicon_io/favicon.ico",
      contactEmail: "info@example.com",
      contactPhone: "+54 9 0000 000-000",
      contactAddress: "Formosa, Argentina",
      socialFacebook: "https://facebook.com/x",
      socialInstagram: "https://instagram.com/x",
      socialWhatsapp: "https://wa.me/0000",
    });
  });

  it("falls back English tagline to the default when not provided", () => {
    const brand = brandPublicFromProperties({
      "app.tagline": "Más de 20 años",
    });
    expect(brand.tagline).toBe("Más de 20 años");
    expect(brand.taglineEn).toBe("Más de 20 años");
  });

  it("uses safe defaults for logo and favicon paths when missing", () => {
    const brand = brandPublicFromProperties({});
    expect(brand.logoPath).toBe("/images/logo.png");
    expect(brand.faviconPath).toBe("/favicon_io/favicon.ico");
    expect(brand.name).toBe("");
  });
});
