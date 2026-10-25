import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetRequestPublicSiteUrl = vi.fn<() => Promise<URL | null>>();

vi.mock("@/lib/site/requestPublicUrl", () => ({
  getRequestPublicSiteUrl: () => mockGetRequestPublicSiteUrl(),
}));

import robots from "@/app/robots";

describe("app/robots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("omits sitemap and host when public URL is unknown", async () => {
    mockGetRequestPublicSiteUrl.mockResolvedValue(null);
    const r = await robots();
    expect(r.sitemap).toBeUndefined();
    expect(r.host).toBeUndefined();
    expect(r.rules).toMatchObject({ userAgent: "*", allow: "/" });
  });

  it("adds sitemap and host when base URL exists", async () => {
    mockGetRequestPublicSiteUrl.mockResolvedValue(new URL("https://example.com/"));
    const r = await robots();
    expect(r.sitemap).toBe("https://example.com/sitemap.xml");
    expect(r.host).toBe("example.com");
  });
});
