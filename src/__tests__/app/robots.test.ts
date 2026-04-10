import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetPublicSiteUrl = vi.fn<() => URL | null>();

vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: () => mockGetPublicSiteUrl(),
}));

import robots from "@/app/robots";

describe("app/robots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("omits sitemap and host when public URL is unknown", () => {
    mockGetPublicSiteUrl.mockReturnValue(null);
    const r = robots();
    expect(r.sitemap).toBeUndefined();
    expect(r.host).toBeUndefined();
    expect(r.rules).toMatchObject({ userAgent: "*", allow: "/" });
  });

  it("adds sitemap and host when base URL exists", () => {
    mockGetPublicSiteUrl.mockReturnValue(new URL("https://example.com/"));
    const r = robots();
    expect(r.sitemap).toBe("https://example.com/sitemap.xml");
    expect(r.host).toBe("example.com");
  });
});
