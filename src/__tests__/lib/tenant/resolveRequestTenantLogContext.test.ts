// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => {
      if (name === "x-ge-tenant") return "mozarthitos";
      if (name === "x-forwarded-host") return "www.mozarthitos.cl";
      return null;
    },
  }),
}));

vi.mock("@/lib/pulsar/pulsarTenantStore", () => ({
  ensureTenantRegistryLoaded: async () => undefined,
}));

import { logServerInfo, registerRequestHeaderReader } from "@/lib/logging/serverActionLog";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";
import { setDynamicTenantsCache, type TenantConfig } from "@/lib/tenant/tenantRegistry";

const mozarthitos = {
  slug: "mozarthitos",
  hosts: ["www.mozarthitos.cl"],
} as TenantConfig;

describe("request log after tenant resolve", () => {
  afterEach(() => {
    setDynamicTenantsCache(null);
    registerRequestHeaderReader(() => null);
  });

  it("writes host and tenant on sendRegistrationAdminEmails:list", async () => {
    setDynamicTenantsCache([mozarthitos]);
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await resolveRequestTenant();
    await logServerInfo("sendRegistrationAdminEmails:list", {
      templateKey: "events.admin_registered",
      locale: "es",
      adminIds: 3,
      authEmails: 3,
      deliverable: 3,
    });

    const payload = infoSpy.mock.calls[0]?.[2] as { host: string; tenantSlug: string };
    expect(payload.host).toBe("www.mozarthitos.cl");
    expect(payload.tenantSlug).toBe("mozarthitos");
    infoSpy.mockRestore();
  });

  it("reads the request when the registered reader is empty", async () => {
    registerRequestHeaderReader(() => null);
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await logServerInfo("sendRegistrationAdminEmails:list", {
      templateKey: "events.admin_registered",
      locale: "es",
    });

    const payload = infoSpy.mock.calls[0]?.[2] as { host: string; tenantSlug: string };
    expect(payload.host).toBe("www.mozarthitos.cl");
    expect(payload.tenantSlug).toBe("mozarthitos");
    infoSpy.mockRestore();
  });
});
