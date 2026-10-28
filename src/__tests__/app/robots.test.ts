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
    expect(r.rules).toMatchObject({ allow: "/", disallow: ["/blog/preview/", "/blog/vista-previa/"] });
  });

  it("hides admin and dashboard on the Centro Listo host", async () => {
    mockGetRequestPublicSiteUrl.mockResolvedValue(new URL("https://centrolisto.cl/"));
    const r = await robots();
    const disallow = (r.rules as { disallow?: string[] }).disallow ?? [];
    expect(disallow).toContain("/es/admin");
    expect(disallow).toContain("/es/dashboard");
    expect(r.sitemap).toBe("https://centrolisto.cl/sitemap.xml");
  });

  it("hides admin on bare localhost when the dev target is pulsar", async () => {
    const previous = process.env.DEV_TENANT_SLUG;
    process.env.DEV_TENANT_SLUG = "pulsar";
    try {
      mockGetRequestPublicSiteUrl.mockResolvedValue(new URL("http://localhost:3000/"));
      const r = await robots();
      const disallow = (r.rules as { disallow?: string[] }).disallow ?? [];
      expect(disallow).toContain("/es/dashboard");
    } finally {
      if (previous === undefined) delete process.env.DEV_TENANT_SLUG;
      else process.env.DEV_TENANT_SLUG = previous;
    }
  });
});
