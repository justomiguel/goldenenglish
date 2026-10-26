import "server-only";
import { logServerError } from "@/lib/logging/serverActionLog";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";
import { readRequestHostRaw, resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";
import {
  isDynamicTenantCacheLoaded,
  isMultiTenantEnabled,
  isPulsarHost,
  listTenants,
  normalizeHost,
  tenantRegistryError,
} from "@/lib/tenant/tenantRegistry";

export type RequestSupabaseEnvReason =
  | "ok"
  | "single_tenant"
  | "registry_error"
  | "pulsar_host"
  | "tenant_not_resolved"
  | "empty_supabase_url"
  | "empty_anon_key";

export type RequestSupabaseEnvDiagnosis = {
  url: string;
  anonKey: string;
  host: string | null;
  tenantSlug: string | null;
  reason: RequestSupabaseEnvReason;
  registryError: string | null;
  tenantCount: number;
  dynamicCacheLoaded: boolean;
};

function snapshot(): Pick<
  RequestSupabaseEnvDiagnosis,
  "registryError" | "tenantCount" | "dynamicCacheLoaded"
> {
  return {
    registryError: tenantRegistryError(),
    tenantCount: listTenants().length,
    dynamicCacheLoaded: isDynamicTenantCacheLoaded(),
  };
}

function logMissingSupabaseEnv(diag: RequestSupabaseEnvDiagnosis): void {
  if (diag.url && diag.anonKey) return;
  if (diag.reason === "pulsar_host") return;
  logServerError("supabase.request_env_missing", {
    reason: diag.reason,
    host: diag.host,
    tenantSlug: diag.tenantSlug,
    registryError: diag.registryError,
    tenantCount: diag.tenantCount,
    dynamicCacheLoaded: diag.dynamicCacheLoaded,
    hasUrl: diag.url.length > 0,
    hasAnonKey: diag.anonKey.length > 0,
  });
}

/** Anon URL and key for this request, plus the fields needed when they are missing. */
export async function readRequestSupabaseEnvDiagnosis(): Promise<RequestSupabaseEnvDiagnosis> {
  const rawHost = await readRequestHostRaw();
  const host = rawHost ? normalizeHost(rawHost) : null;

  if (!isMultiTenantEnabled()) {
    const env = readSupabasePublicEnv();
    const reason: RequestSupabaseEnvReason = env.url && env.anonKey ? "ok" : "single_tenant";
    const diag: RequestSupabaseEnvDiagnosis = {
      url: env.url,
      anonKey: env.anonKey,
      host,
      tenantSlug: null,
      reason,
      ...snapshot(),
    };
    logMissingSupabaseEnv(diag);
    return diag;
  }

  const tenant = await resolveRequestTenant();
  const counts = snapshot();
  if (counts.registryError) {
    const diag: RequestSupabaseEnvDiagnosis = {
      ...counts,
      url: "",
      anonKey: "",
      host,
      tenantSlug: null,
      reason: "registry_error",
    };
    logMissingSupabaseEnv(diag);
    return diag;
  }
  if (host && isPulsarHost(host)) {
    return { ...counts, url: "", anonKey: "", host, tenantSlug: null, reason: "pulsar_host" };
  }
  if (!tenant) {
    const diag: RequestSupabaseEnvDiagnosis = {
      ...counts,
      url: "",
      anonKey: "",
      host,
      tenantSlug: null,
      reason: "tenant_not_resolved",
    };
    logMissingSupabaseEnv(diag);
    return diag;
  }

  const url = tenant.supabaseUrl.trim();
  const anonKey = tenant.supabaseAnonKey.trim();
  const reason: RequestSupabaseEnvReason = !url
    ? "empty_supabase_url"
    : !anonKey
      ? "empty_anon_key"
      : "ok";
  const diag: RequestSupabaseEnvDiagnosis = {
    ...snapshot(),
    url,
    anonKey,
    host,
    tenantSlug: tenant.slug,
    reason,
  };
  logMissingSupabaseEnv(diag);
  return diag;
}

/** Anon URL and key for this request. Falls back to env for single-tenant and localhost. */
export async function readRequestSupabasePublicEnv(): Promise<{ url: string; anonKey: string }> {
  const diag = await readRequestSupabaseEnvDiagnosis();
  return { url: diag.url, anonKey: diag.anonKey };
}

export function missingSupabaseEnvMessage(diag: RequestSupabaseEnvDiagnosis): string {
  return (
    `Supabase URL or anon key is missing ` +
    `(host=${diag.host ?? "none"}, slug=${diag.tenantSlug ?? "none"}, ` +
    `reason=${diag.reason}, tenants=${diag.tenantCount}, ` +
    `dynamicCache=${diag.dynamicCacheLoaded}, ` +
    `registryError=${diag.registryError ?? "none"}).`
  );
}
