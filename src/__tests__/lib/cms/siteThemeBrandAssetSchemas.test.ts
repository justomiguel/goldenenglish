import { describe, expect, it } from "vitest";
import {
  uploadSiteThemeFaviconFromEditorSchema,
  uploadSiteThemeLogoFromEditorSchema,
} from "@/lib/cms/siteThemeBrandAssetSchemas";

describe("siteThemeBrandAssetSchemas", () => {
  it("accepts logo upload payload", () => {
    const r = uploadSiteThemeLogoFromEditorSchema.safeParse({
      locale: "es",
      id: "550e8400-e29b-41d4-a716-446655440000",
      contentType: "image/png",
      fileBase64: "abc",
    });
    expect(r.success).toBe(true);
  });

  it("rejects logo with invalid mime", () => {
    const r = uploadSiteThemeLogoFromEditorSchema.safeParse({
      locale: "es",
      id: "550e8400-e29b-41d4-a716-446655440000",
      contentType: "application/zip",
      fileBase64: "abc",
    });
    expect(r.success).toBe(false);
  });

  it("accepts favicon ZIP branch", () => {
    const r = uploadSiteThemeFaviconFromEditorSchema.safeParse({
      locale: "en",
      id: "550e8400-e29b-41d4-a716-446655440000",
      faviconKind: "zip",
      faviconZipBase64: "e30=",
    });
    expect(r.success).toBe(true);
  });

  it("accepts favicon single image", () => {
    const r = uploadSiteThemeFaviconFromEditorSchema.safeParse({
      locale: "en",
      id: "550e8400-e29b-41d4-a716-446655440000",
      faviconKind: "single",
      faviconContentType: "image/png",
      faviconBase64: "e30=",
    });
    expect(r.success).toBe(true);
  });
});
