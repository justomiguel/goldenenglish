import { beforeEach, describe, expect, it, vi } from "vitest";

const isPulsarPlatformRequest = vi.fn<() => Promise<boolean>>();
const getRequestPublicSiteUrl = vi.fn<() => Promise<URL | null>>();

vi.mock("@/lib/tenant/tenantRequestContext", () => ({
  isPulsarPlatformRequest: () => isPulsarPlatformRequest(),
}));

vi.mock("@/lib/site/requestPublicUrl", () => ({
  getRequestPublicSiteUrl: () => getRequestPublicSiteUrl(),
}));

import { GET } from "@/app/llms.txt/route";

describe("GET /llms.txt", () => {
  beforeEach(() => {
    isPulsarPlatformRequest.mockReset();
    getRequestPublicSiteUrl.mockReset();
  });

  it("returns 404 on an institute host", async () => {
    isPulsarPlatformRequest.mockResolvedValue(false);
    const response = await GET();
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not found");
  });

  it("returns the public map on Centro Listo", async () => {
    isPulsarPlatformRequest.mockResolvedValue(true);
    getRequestPublicSiteUrl.mockResolvedValue(new URL("https://centrolisto.cl"));
    const response = await GET();
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(response.headers.get("vary")).toBe("Host");
    expect(body).toContain("https://centrolisto.cl/es/contacto");
    expect(body).toContain("https://centrolisto.cl/en/producto");
    expect(body).not.toContain("/admin");
  });
});
