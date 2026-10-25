/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const headerGet = vi.hoisted(() => vi.fn((_name: string): string | null => null));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: (name: string) => headerGet(name) }),
}));

import { absoluteUrlForRequest, getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";

const nago = {
  slug: "nago",
  hosts: ["capoeiranago.cl", "www.capoeiranago.cl"],
  supabaseUrl: "https://nago.supabase.co",
  supabaseAnonKey: "anon-nago",
  supabaseServiceRoleKey: "service-nago",
  publicUrl: "https://www.capoeiranago.cl",
};

describe("getRequestPublicSiteUrl", () => {
  const prevTenants = process.env.TENANTS_CONFIG_JSON;
  const prevDev = process.env.DEV_TENANT_SLUG;
  const prevApp = process.env.NEXT_PUBLIC_APP_URL;
  const prevVercel = process.env.VERCEL_URL;

  beforeEach(() => {
    headerGet.mockReset();
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([nago]);
    process.env.DEV_TENANT_SLUG = "nago";
    process.env.NEXT_PUBLIC_APP_URL = "https://www.capoeiranago.cl";
  });

  afterEach(() => {
    if (prevTenants === undefined) delete process.env.TENANTS_CONFIG_JSON;
    else process.env.TENANTS_CONFIG_JSON = prevTenants;
    if (prevDev === undefined) delete process.env.DEV_TENANT_SLUG;
    else process.env.DEV_TENANT_SLUG = prevDev;
    if (prevApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prevApp;
    if (prevVercel === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = prevVercel;
  });

  it("keeps localhost, including the port", async () => {
    headerGet.mockImplementation((name: string) => (name === "host" ? "localhost:3000" : null));
    const url = await getRequestPublicSiteUrl();
    expect(url?.origin).toBe("http://localhost:3000");
  });

  it("uses the tenant public origin for a production host", async () => {
    headerGet.mockImplementation((name: string) =>
      name === "host" ? "www.capoeiranago.cl" : null,
    );
    const url = await getRequestPublicSiteUrl();
    expect(url?.origin).toBe("https://www.capoeiranago.cl");
    expect((await absoluteUrlForRequest("blog"))?.href).toBe("https://www.capoeiranago.cl/blog");
  });

  it("falls back when the tenant origin is missing or not a URL", async () => {
    const { publicUrl: _ignored, ...withoutPublicUrl } = nago;
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([withoutPublicUrl]);
    headerGet.mockImplementation((name: string) =>
      name === "host" ? "www.capoeiranago.cl" : null,
    );
    expect((await getRequestPublicSiteUrl())?.origin).toBe("https://capoeiranago.cl");

    process.env.TENANTS_CONFIG_JSON = JSON.stringify([
      { ...nago, publicUrl: "https://www.capoeiranago.cl/" },
    ]);
    headerGet.mockImplementation((name: string) =>
      name === "host" ? "www.capoeiranago.cl" : null,
    );
    expect((await getRequestPublicSiteUrl())?.href).toBe("https://www.capoeiranago.cl/");

    process.env.TENANTS_CONFIG_JSON = JSON.stringify([{ ...nago, publicUrl: "not a url" }]);
    expect((await getRequestPublicSiteUrl())?.origin).toBe("https://www.capoeiranago.cl");

    delete process.env.TENANTS_CONFIG_JSON;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    headerGet.mockImplementation(() => null);
    expect(await absoluteUrlForRequest("/x")).toBeNull();
  });
});
