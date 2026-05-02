import { describe, expect, it } from "vitest";
import { completeInitialSiteSetupInputSchema } from "@/lib/site/siteSetupCompletionSchema";

describe("completeInitialSiteSetupInputSchema", () => {
  const shared = {
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
  };

  const singlePayload = {
    ...shared,
    faviconKind: "single" as const,
    faviconContentType: "image/png",
    faviconBase64: "e30=",
  };

  it("accepts empty optional social fields", () => {
    const r = completeInitialSiteSetupInputSchema.safeParse({
      ...singlePayload,
      socialFacebook: "",
      socialInstagram: "",
      socialWhatsapp: "",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.socialFacebook).toBeUndefined();
    }
  });

  it("rejects invalid URL when non-empty", () => {
    const r = completeInitialSiteSetupInputSchema.safeParse({
      ...singlePayload,
      socialFacebook: "not-a-url",
    });
    expect(r.success).toBe(false);
  });

  it("accepts favicon ZIP branch", () => {
    const r = completeInitialSiteSetupInputSchema.safeParse({
      ...shared,
      faviconKind: "zip",
      faviconZipBase64: "e30=",
    });
    expect(r.success).toBe(true);
  });
});
