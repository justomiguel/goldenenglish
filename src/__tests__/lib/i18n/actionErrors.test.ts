/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import { adminActionDict, localeFromFormData, paymentActionDict } from "@/lib/i18n/actionErrors";

describe("localeFromFormData", () => {
  it("uses default locale when field missing or blank", () => {
    expect(localeFromFormData(new FormData())).toBe(defaultLocale);
    const fd = new FormData();
    fd.set("locale", "   ");
    expect(localeFromFormData(fd)).toBe(defaultLocale);
  });

  it("trims locale from FormData", () => {
    const fd = new FormData();
    fd.set("locale", "  es  ");
    expect(localeFromFormData(fd)).toBe("es");
  });
});

describe("paymentActionDict", () => {
  it("loads payment errors for locale from FormData", async () => {
    const fd = new FormData();
    fd.set("locale", "en");
    const pe = await paymentActionDict(fd);
    expect(pe.unauthorized.length).toBeGreaterThan(0);
  });
});

describe("adminActionDict", () => {
  it("falls back to default locale when empty string passed", async () => {
    const ae = await adminActionDict("");
    expect(ae.forbidden.length).toBeGreaterThan(0);
  });

  it("loads admin errors for explicit locale", async () => {
    const ae = await adminActionDict("es");
    expect(ae.forbidden.length).toBeGreaterThan(0);
  });
});
