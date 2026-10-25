import { AsyncLocalStorage } from "node:async_hooks";
import type { TenantConfig } from "@/lib/tenant/tenantRegistry";
import { getAlsTenant, registerAlsTenantReader } from "@/lib/tenant/alsTenantAccessor";

const tenantAls = new AsyncLocalStorage<TenantConfig>();

registerAlsTenantReader(() => tenantAls.getStore() ?? null);

export { getAlsTenant };

/** Cron loops enter this store so sync readers see the active institute. */
export function runWithTenant<T>(tenant: TenantConfig, work: () => T): T {
  return tenantAls.run(tenant, work);
}
