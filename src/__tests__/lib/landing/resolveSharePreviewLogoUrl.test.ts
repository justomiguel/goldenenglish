import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BrandPublic } from "@/lib/brand/server";
import { resolveSharePreviewLogoAbsoluteUrl } from "@/lib/landing/resolveSharePreviewLogoUrl";

const brand = {
  logoPath: "/images/custom/logo.png",
} as BrandPublic;

describe("resolveSharePreviewLogoAbsoluteUrl", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns first bundled URL that responds OK", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/images/mozarthitos/logo/1.png")) {
        return { ok: true };
      }
      return { ok: false };
    });
    vi.stubGlobal("fetch", fetchMock);

    const out = await resolveSharePreviewLogoAbsoluteUrl(
      "https://example.com",
      "mozarthitos",
      brand,
    );
    expect(out).toBe("https://example.com/images/mozarthitos/logo/1.png");
  });

  it("tries golden PNG then AVIF before falling back to brand logo", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/images/golden/logo/1.png")) return { ok: false };
      if (url.endsWith("/images/golden/logo/1.avif")) return { ok: true };
      return { ok: false };
    });
    vi.stubGlobal("fetch", fetchMock);

    const out = await resolveSharePreviewLogoAbsoluteUrl(
      "https://example.com",
      "golden",
      brand,
    );
    expect(out).toBe("https://example.com/images/golden/logo/1.avif");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to resolveBrandLogoAbsoluteUrl when no candidate is OK", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));

    const out = await resolveSharePreviewLogoAbsoluteUrl(
      "https://example.com",
      "espaciozenit",
      brand,
    );
    expect(out).toBe("https://example.com/images/custom/logo.png");
  });
});
