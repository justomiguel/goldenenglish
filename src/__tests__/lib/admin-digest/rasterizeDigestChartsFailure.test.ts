import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@resvg/resvg-js", () => ({
  Resvg: class {
    constructor() {
      throw new Error("renderer unavailable");
    }
  },
}));

describe("rasterizeDigestSvg failure", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns null when the renderer throws", async () => {
    const { rasterizeDigestSvg } = await import("@/lib/admin-digest/rasterizeDigestCharts");
    await expect(rasterizeDigestSvg("<svg></svg>")).resolves.toBeNull();
  });
});
