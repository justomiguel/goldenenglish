/** @vitest-environment node */
import { afterEach, describe, expect, it } from "vitest";
import { preferTenantValue } from "@/lib/tenant/preferTenantValue";

describe("preferTenantValue", () => {
  const prev = process.env.TENANTS_CONFIG_JSON;

  afterEach(() => {
    if (prev === undefined) delete process.env.TENANTS_CONFIG_JSON;
    else process.env.TENANTS_CONFIG_JSON = prev;
  });

  it("uses the env value when multi-tenant mode is off", () => {
    delete process.env.TENANTS_CONFIG_JSON;
    expect(preferTenantValue(null, "from-env")).toBe("from-env");
  });

  it("ignores the env value when multi-tenant mode is on and the tenant field is empty", () => {
    process.env.TENANTS_CONFIG_JSON = "[]";
    expect(preferTenantValue(null, "from-env")).toBe("");
    expect(preferTenantValue("  from-tenant  ", "from-env")).toBe("from-tenant");
  });
});
