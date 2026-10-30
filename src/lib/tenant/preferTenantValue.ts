import { isMultiTenantEnabled } from "@/lib/tenant/tenantRegistry";

/**
 * Prefer the institute field.
 * When `TENANTS_CONFIG_JSON` is set, ignore the single-tenant env value.
 */
export function preferTenantValue(
  tenantValue: string | null | undefined,
  envFallback: string | null | undefined,
): string {
  const fromTenant = tenantValue?.trim() ?? "";
  if (fromTenant) return fromTenant;
  if (isMultiTenantEnabled()) return "";
  return envFallback?.trim() ?? "";
}

/**
 * Payment encryption and KV are one platform secret.
 * An active institute with an empty field uses the platform env.
 * A stored institute value still wins.
 * With no active institute, multi-tenant mode ignores the env value.
 */
export function preferSharedPlatformSecret(
  activeTenant: boolean,
  tenantValue: string | null | undefined,
  envFallback: string | null | undefined,
): string {
  const fromTenant = tenantValue?.trim() ?? "";
  if (fromTenant) return fromTenant;
  if (activeTenant) return envFallback?.trim() ?? "";
  return preferTenantValue(null, envFallback);
}
