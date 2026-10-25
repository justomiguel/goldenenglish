import type { TenantConfig } from "@/lib/tenant/tenantRegistry";

/**
 * Reads the AsyncLocalStorage tenant without importing the Node async hooks module.
 * Client-reachable modules import this file. `tenantAls.ts` registers the real
 * reader when server code loads it. Before that, no tenant store can exist.
 */
let reader: () => TenantConfig | null = () => null;

export function registerAlsTenantReader(next: () => TenantConfig | null): void {
  reader = next;
}

export function getAlsTenant(): TenantConfig | null {
  return reader();
}
