import { describe, expect, it } from "vitest";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import { brandForPublicChrome, NAGO_BUNDLED_LOGO, resolveNagoLogo } from "@/lib/landing/nagoLogo";

describe("resolveNagoLogo", () => {
  it("always uses the official bundled Nagô mark", () => {
    expect(resolveNagoLogo(mockBrandPublic)).toBe(NAGO_BUNDLED_LOGO);
    expect(
      resolveNagoLogo({ ...mockBrandPublic, logoPath: "https://cdn.example/old-nago.png" }),
    ).toBe(NAGO_BUNDLED_LOGO);
    expect(NAGO_BUNDLED_LOGO).toBe("/images/nago/logo/logo.png");
  });

  it("swaps the Nagô auth mark and leaves other themes alone", () => {
    expect(brandForPublicChrome("nago", mockBrandPublic).logoPath).toBe(NAGO_BUNDLED_LOGO);
    expect(brandForPublicChrome("classic", mockBrandPublic)).toBe(mockBrandPublic);
  });
});
