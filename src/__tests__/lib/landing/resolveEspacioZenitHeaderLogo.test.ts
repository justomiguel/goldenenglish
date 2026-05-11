import { describe, expect, it } from "vitest";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import { resolveEspacioZenitHeaderLogo } from "@/lib/landing/resolveEspacioZenitHeaderLogo";

describe("resolveEspacioZenitHeaderLogo", () => {
  it("keeps custom logo path when not generic placeholder", () => {
    expect(
      resolveEspacioZenitHeaderLogo(
        { ...mockBrandPublic, logoPath: "/images/custom/logo.png" },
        undefined,
      ),
    ).toBe("/images/custom/logo.png");
  });

  it("uses bundled zenit header image when brand still uses default logo path", () => {
    const bundled = resolveEspacioZenitHeaderLogo(
      { ...mockBrandPublic, logoPath: "/images/logo.png" },
      undefined,
    );
    expect(bundled).toContain("espaciozenit");
    expect(bundled).toContain("inicio");
  });
});
