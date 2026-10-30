/** @vitest-environment node */
import { afterEach, describe, expect, it } from "vitest";
import {
  preferSharedPlatformSecret,
  preferTenantValue,
} from "@/lib/tenant/preferTenantValue";

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

describe("preferSharedPlatformSecret", () => {
  const prev = process.env.TENANTS_CONFIG_JSON;

  afterEach(() => {
    if (prev === undefined) delete process.env.TENANTS_CONFIG_JSON;
    else process.env.TENANTS_CONFIG_JSON = prev;
  });

  it("uses the platform env when the active institute field is empty", () => {
    process.env.TENANTS_CONFIG_JSON = "[]";
    expect(preferSharedPlatformSecret(true, null, "from-env")).toBe("from-env");
    expect(preferSharedPlatformSecret(true, "  ", "from-env")).toBe("from-env");
  });

  it("keeps a stored institute value ahead of the platform env", () => {
    process.env.TENANTS_CONFIG_JSON = "[]";
    expect(preferSharedPlatformSecret(true, "  stored  ", "from-env")).toBe("stored");
  });

  it("ignores the platform env when no institute is active in multi-tenant mode", () => {
    process.env.TENANTS_CONFIG_JSON = "[]";
    expect(preferSharedPlatformSecret(false, null, "from-env")).toBe("");
  });
});
