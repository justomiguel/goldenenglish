import { afterEach, describe, expect, it } from "vitest";
import { isInitialSiteSetupBypassed } from "@/lib/site/initialSiteSetupBypass";

describe("isInitialSiteSetupBypassed", () => {
  const prevJson = process.env.TENANTS_CONFIG_JSON;
  const prevSkip = process.env.SKIP_INITIAL_SITE_SETUP;

  afterEach(() => {
    if (prevJson === undefined) delete process.env.TENANTS_CONFIG_JSON;
    else process.env.TENANTS_CONFIG_JSON = prevJson;
    if (prevSkip === undefined) delete process.env.SKIP_INITIAL_SITE_SETUP;
    else process.env.SKIP_INITIAL_SITE_SETUP = prevSkip;
  });

  it("closes the wizard for one tenant flag", () => {
    delete process.env.TENANTS_CONFIG_JSON;
    delete process.env.SKIP_INITIAL_SITE_SETUP;
    expect(isInitialSiteSetupBypassed({ skipInitialSiteSetup: true })).toBe(true);
  });

  it("ignores SKIP_INITIAL_SITE_SETUP while the tenant JSON is set", () => {
    process.env.TENANTS_CONFIG_JSON = "[]";
    process.env.SKIP_INITIAL_SITE_SETUP = "1";
    expect(isInitialSiteSetupBypassed(null)).toBe(false);
    expect(isInitialSiteSetupBypassed({ skipInitialSiteSetup: false })).toBe(false);
  });

  it("honors SKIP_INITIAL_SITE_SETUP only when the tenant JSON is unset", () => {
    delete process.env.TENANTS_CONFIG_JSON;
    process.env.SKIP_INITIAL_SITE_SETUP = "1";
    expect(isInitialSiteSetupBypassed(null)).toBe(true);
  });
});
