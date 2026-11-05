import "server-only";
import { headers } from "next/headers";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import {
  type TenantConfig,
  isMultiTenantEnabled,
  isPulsarRequestFromHeaderGet,
  tenantFromHeaderGet,
  tenantRegistryError,
} from "@/lib/tenant/tenantRegistry";

/** True when the current HTTP request targets the Pulsar platform host (`pulsarlab.cl` or `DEV_TENANT_SLUG=pulsar`). */
export async function isPulsarPlatformRequest(): Promise<boolean> {
  if (getAlsTenant()) return false;
  const { ensureTenantRegistryLoaded } = await import("@/lib/pulsar/pulsarTenantStore");
  await ensureTenantRegistryLoaded();
  try {
    const headerStore = await headers();
    return isPulsarRequestFromHeaderGet((name) => headerStore.get(name));
  } catch {
    return process.env.DEV_TENANT_SLUG?.trim().toLowerCase() === "pulsar";
  }
}

/**
 * Institute for this request. ALS wins (cron). Otherwise read `Host`.
 * Returns null when multi-tenant mode is off or when the host is Pulsar.
 */
export async function resolveRequestTenant(): Promise<TenantConfig | null> {
  const fromAls = getAlsTenant();
  if (fromAls) return fromAls;
  // Middleware and the Node render do not share memory. Load the Pulsar list here.
  const { ensureTenantRegistryLoaded } = await import("@/lib/pulsar/pulsarTenantStore");
  await ensureTenantRegistryLoaded();
  if (!isMultiTenantEnabled() || tenantRegistryError()) return null;

  try {
    const headerStore = await headers();
    return tenantFromHeaderGet((name) => headerStore.get(name));
  } catch {
    return null;
  }
}

/** Raw `Host` header, including the port. Null outside a request. */
export async function readRequestHostRaw(): Promise<string | null> {
  try {
    const headerStore = await headers();
    const raw = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
    const first = raw?.split(",")[0]?.trim() ?? "";
    return first || null;
  } catch {
    return null;
  }
}
