/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import { decodePngRgba } from "@/lib/brand/scalePng";

vi.mock("@/lib/brand/server", () => ({
  getBrandForRequest: vi.fn(),
}));

vi.mock("@/lib/theme/loadEffectiveProperties", () => ({
  loadEffectiveProperties: vi.fn(() =>
    Promise.resolve({
      properties: {
        "color.foreground": "#3A2A52",
        "color.background": "#FCF4F7",
      },
      activeThemeSlug: "matiss",
    }),
  ),
}));

import { getBrandForRequest } from "@/lib/brand/server";
import { GET } from "@/app/pwa/icon/[size]/route";

describe("GET /pwa/icon/[size]", () => {
  beforeEach(() => {
    vi.mocked(getBrandForRequest).mockResolvedValue({
      ...mockBrandPublic,
      name: "Matiss Studio",
      logoPath: "/images/matiss/logo/logo.png",
      faviconPath: "/images/matiss/logo/logo.png",
    });
  });

  function ctx(size: string) {
    return { params: Promise.resolve({ size }) };
  }

  it("returns a PNG whose pixels match 192 and 512", async () => {
    for (const size of ["192", "512"]) {
      const res = await GET(new Request(`http://localhost/pwa/icon/${size}`), ctx(size));
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("image/png");
      expect(res.headers.get("cache-control")).toContain("public");
      expect(res.headers.get("cache-control")).toContain("max-age=86400");
      const decoded = decodePngRgba(new Uint8Array(await res.arrayBuffer()));
      expect(decoded?.width).toBe(Number(size));
      expect(decoded?.height).toBe(Number(size));
    }
  });

  it("returns 404 for a size the manifest does not use", async () => {
    const res = await GET(new Request("http://localhost/pwa/icon/64"), ctx("64"));
    expect(res.status).toBe(404);
  });
});
