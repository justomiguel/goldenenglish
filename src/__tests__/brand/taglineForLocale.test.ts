import { describe, it, expect } from "vitest";
import { taglineForLocale } from "@/lib/brand/taglineForLocale";
import type { BrandPublic } from "@/lib/brand/server";

const brand = {
  name: "X",
  legalName: "Y",
  tagline: "ES",
  taglineEn: "EN",
  legalRegistry: "",
  logoPath: "",
  logoAlt: "",
  faviconPath: "",
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  socialFacebook: "",
  socialInstagram: "",
  socialWhatsapp: "",
} satisfies BrandPublic;

describe("taglineForLocale", () => {
  it("uses English tagline for en", () => {
    expect(taglineForLocale(brand, "en")).toBe("EN");
  });

  it("uses default tagline for es", () => {
    expect(taglineForLocale(brand, "es")).toBe("ES");
  });
});
