import { normalizeHost } from "./parseTenantConfigJson";
import type { TenantConfig, TenantPublicEnv } from "./tenantRegistry";

export function tenantPublicEnv(tenant: TenantConfig): TenantPublicEnv {
  const origin =
    tenant.publicUrl ??
    (tenant.hosts[0] ? `https://${normalizeHost(tenant.hosts[0])}` : null);
  return {
    url: tenant.supabaseUrl,
    anonKey: tenant.supabaseAnonKey,
    origin,
    ...(tenant.googleMapsApiKey ? { googleMapsApiKey: tenant.googleMapsApiKey } : {}),
    ...(tenant.googleMapsMapId ? { googleMapsMapId: tenant.googleMapsMapId } : {}),
    ...(tenant.vapidPublicKey ? { vapidPublicKey: tenant.vapidPublicKey } : {}),
    ...(tenant.debugLogin ? { debugLogin: true } : {}),
    ...(tenant.dataMode === "shared_schema" && tenant.postgresSchema
      ? { postgresSchema: tenant.postgresSchema }
      : {}),
  };
}

