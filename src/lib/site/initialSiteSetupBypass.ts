import { isMultiTenantEnabled } from "@/lib/tenant/tenantRegistry";

type SiteSetupTenant = { skipInitialSiteSetup?: boolean } | null | undefined;

/**
 * True when this institute must not open the first-run wizard.
 * `SKIP_INITIAL_SITE_SETUP=1` applies only when `TENANTS_CONFIG_JSON` is unset.
 */
export function isInitialSiteSetupBypassed(tenant: SiteSetupTenant): boolean {
  if (tenant?.skipInitialSiteSetup) return true;
  return !isMultiTenantEnabled() && process.env.SKIP_INITIAL_SITE_SETUP === "1";
}
