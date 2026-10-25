import "server-only";
import { headers } from "next/headers";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import {
  type TenantConfig,
  GE_TENANT_HEADER,
  getTenantBySlug,
  isLocalDevHost,
  isMultiTenantEnabled,
  isPulsarRequestFromHeaderGet,
  listTenants,
  normalizeHost,
  resolveTenantByHost,
  tenantRegistryError,
} from "@/lib/tenant/tenantRegistry";

/** True when the current HTTP request targets the Pulsar platform host (`pulsarlab.cl` or `DEV_TENANT_SLUG=pulsar`). */
export async function isPulsarPlatformRequest(): Promise<boolean> {
  if (getAlsTenant()) return false;
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
  if (!isMultiTenantEnabled() || tenantRegistryError()) return null;

  let host: string | null = null;
  let slugHeader: string | null = null;
  try {
    const headerStore = await headers();
    if (isPulsarRequestFromHeaderGet((name) => headerStore.get(name))) {
      return null;
    }
    slugHeader = headerStore.get(GE_TENANT_HEADER)?.trim() ?? null;
    const raw = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
    host = raw ? normalizeHost(raw) : null;
  } catch {
    return null;
  }

  if (slugHeader) {
    const bySlug = getTenantBySlug(slugHeader);
    if (bySlug) return bySlug;
  }
  if (host && isLocalDevHost(host)) {
    const devSlug = process.env.DEV_TENANT_SLUG?.trim();
    if (devSlug) return getTenantBySlug(devSlug);
    return listTenants()[0] ?? null;
  }
  return resolveTenantByHost(host);
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
