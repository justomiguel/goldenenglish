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
