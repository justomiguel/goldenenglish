/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from "vitest";

const resolveRequestTenant = vi.hoisted(() => vi.fn());

vi.mock("@/lib/tenant/tenantRequestContext", () => ({
  resolveRequestTenant: () => resolveRequestTenant(),
}));

import { getRequestMailTenantDomain } from "@/lib/register/requestMailTenant";

describe("getRequestMailTenantDomain", () => {
  const prevJson = process.env.TENANTS_CONFIG_JSON;
  const prevMail = process.env.MAIL_TENANT;

  afterEach(() => {
    if (prevJson === undefined) delete process.env.TENANTS_CONFIG_JSON;
    else process.env.TENANTS_CONFIG_JSON = prevJson;
    if (prevMail === undefined) delete process.env.MAIL_TENANT;
    else process.env.MAIL_TENANT = prevMail;
    resolveRequestTenant.mockReset();
  });

  it("uses the tenant domain, then null in multi-tenant, then MAIL_TENANT", async () => {
    resolveRequestTenant.mockResolvedValue({ mailTenant: "Alumnos.Nago.cl" });
    expect(await getRequestMailTenantDomain()).toBe("alumnos.nago.cl");

    delete process.env.TENANTS_CONFIG_JSON;
    resolveRequestTenant.mockResolvedValue(null);
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([
      {
        slug: "nago",
        hosts: ["capoeiranago.cl"],
        supabaseUrl: "https://nago.supabase.co",
        supabaseAnonKey: "anon",
        supabaseServiceRoleKey: "srv",
      },
    ]);
    expect(await getRequestMailTenantDomain()).toBeNull();

    delete process.env.TENANTS_CONFIG_JSON;
    process.env.MAIL_TENANT = "single.test";
    expect(await getRequestMailTenantDomain()).toBe("single.test");
  });
});
