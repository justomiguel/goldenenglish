import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import { runWithTenant } from "@/lib/tenant/tenantAls";
import type { TenantConfig } from "@/lib/tenant/tenantRegistry";

const tenant = { slug: "canary", hosts: ["canary.test"] } as unknown as TenantConfig;

describe("alsTenantAccessor", () => {
  it("returns null outside a tenant store", () => {
    expect(getAlsTenant()).toBeNull();
  });

  it("sees the tenant inside runWithTenant", () => {
    expect(runWithTenant(tenant, () => getAlsTenant()?.slug)).toBe("canary");
  });

  it("keeps node:async_hooks out of the browser Supabase client graph", () => {
    const src = readFileSync(
      path.join(process.cwd(), "src/lib/supabase/publicEnv.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/tenant\/tenantAls"/);
    expect(src).toMatch(/tenant\/alsTenantAccessor"/);
  });
});
