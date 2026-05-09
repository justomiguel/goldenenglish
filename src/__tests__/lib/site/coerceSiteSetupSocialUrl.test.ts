import { describe, expect, it } from "vitest";
import {
  coerceInitialSiteSetupSocialFields,
  coerceSiteSetupSocialUrl,
} from "@/lib/site/coerceSiteSetupSocialUrl";
import { completeInitialSiteSetupInputSchema } from "@/lib/site/siteSetupCompletionSchema";

describe("coerceSiteSetupSocialUrl", () => {
  it("normalizes instagram @handle", () => {
    expect(coerceSiteSetupSocialUrl("@academy", "instagram")).toBe(
      "https://www.instagram.com/academy/",
    );
  });

  it("adds https when scheme omitted", () => {
    expect(coerceSiteSetupSocialUrl("www.facebook.com/foo", "facebook")).toBe(
      "https://www.facebook.com/foo",
    );
  });

  it("normalizes whatsapp from digits only", () => {
    expect(coerceSiteSetupSocialUrl("+54 9 11 1234-5678", "whatsapp")).toBe(
      "https://wa.me/5491112345678",
    );
  });

  it("returns undefined for empty", () => {
    expect(coerceSiteSetupSocialUrl("  ", "instagram")).toBeUndefined();
  });
});

describe("coerceInitialSiteSetupSocialFields", () => {
  const base = {
    locale: "en",
    themeId: "550e8400-e29b-41d4-a716-446655440000",
    appName: "Inst",
    legalName: "Inst Legal",
    tagline: "Tag",
    logoAlt: "Alt",
    contactEmail: "a@b.co",
    contactPhone: "+5491111222333",
    contactAddress: "Addr",
    logoContentType: "image/png",
    logoBase64: "e30=",
    faviconKind: "single" as const,
    faviconContentType: "image/png",
    faviconBase64: "e30=",
  };

  it("coerces social so full schema accepts www-only instagram", () => {
    const r = coerceInitialSiteSetupSocialFields({
      ...base,
      socialInstagram: "instagram.com/foo/",
    });
    expect(r.ok).toBe(true);
    const p = completeInitialSiteSetupInputSchema.safeParse(r.value);
    expect(p.success).toBe(true);
    if (p.success) {
      expect(p.data.socialInstagram).toMatch(/^https:\/\/instagram\.com\//);
    }
  });
});
