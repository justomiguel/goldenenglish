/**
 * Server-only map of institute hosts to Supabase projects, plus Pulsar host detection.
 * Supports dynamic rows loaded from Pulsar `platform_tenants` and falls back to
 * `TENANTS_CONFIG_JSON` (or single-tenant env when neither is configured).
 */
import { normalizeHost, parseTenantConfigJson } from "./parseTenantConfigJson";

export { normalizeHost };

export const GE_TENANT_HEADER = "x-ge-tenant";
export const PULSAR_SLUG = "pulsar";
export const DEFAULT_PULSAR_HOSTS = [
  "pulsarlab.cl",
  "www.pulsarlab.cl",
  "pulsarlab.vercel.app",
] as const;

export type TenantConfig = {
  slug: string;
  hosts: string[];
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  databaseUrl: string | null;
  brandThemeSlug: string | null;
  mailTenant: string | null;
  resendFromEmail: string | null;
  resendApiKey: string | null;
  publicUrl: string | null;
  paymentGatewaySecretEncryptionKey: string | null;
  whatsappAccessToken: string | null;
  whatsappPhoneNumberId: string | null;
  whatsappClassReminderTemplateName: string | null;
  vapidPublicKey: string | null;
  vapidPrivateKey: string | null;
  vapidContactEmail: string | null;
  googleMapsApiKey: string | null;
  googleMapsMapId: string | null;
  kvRestApiUrl: string | null;
  kvRestApiToken: string | null;
  debugLogin: boolean;
  skipInitialSiteSetup: boolean;
};

export type TenantPublicEnv = {
  url: string;
  anonKey: string;
  origin: string | null;
  googleMapsApiKey?: string;
  googleMapsMapId?: string;
  vapidPublicKey?: string;
  debugLogin?: boolean;
};

const ENV_KEY = "TENANTS_CONFIG_JSON";

let dynamicTenants: TenantConfig[] | null = null;
let dynamicPulsarHosts: string[] | null = null;
let cachedRaw: string | undefined;
let cachedTenants: TenantConfig[] = [];
let cachedError: string | null = null;

/** Populates or clears the DB-backed tenant list from Pulsar `platform_tenants`. */
export function setDynamicTenantsCache(tenants: TenantConfig[] | null): void {
  dynamicTenants = tenants;
}

/** True after this process has stored rows from Pulsar `platform_tenants`. */
export function isDynamicTenantCacheLoaded(): boolean {
  return dynamicTenants !== null;
}

/** Populates or clears the DB-backed Pulsar host list from Pulsar `platform_settings.pulsar_hosts`. */
export function setDynamicPulsarHostsCache(hosts: string[] | null): void {
  if (!hosts) {
    dynamicPulsarHosts = null;
    return;
  }
  const normalized = Array.from(
    new Set(hosts.map((h) => normalizeHost(h)).filter((h) => h.length > 0)),
  );
  dynamicPulsarHosts = normalized.length > 0 ? normalized : null;
}

/** True after this process has stored Pulsar hosts from `platform_settings.pulsar_hosts`. */
export function isDynamicPulsarHostsCacheLoaded(): boolean {
  return dynamicPulsarHosts !== null;
}

export function isMultiTenantEnabled(): boolean {
  if (dynamicTenants !== null) return true;
  if (process.env.PULSAR_SUPABASE_URL?.trim() && process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return true;
  }
  return Boolean(process.env[ENV_KEY]?.trim());
}

export function readTenantRegistry(): { tenants: TenantConfig[]; error: string | null } {
  if (dynamicTenants !== null) {
    return { tenants: dynamicTenants, error: null };
  }
  const raw = process.env[ENV_KEY];
  if (raw === cachedRaw) return { tenants: cachedTenants, error: cachedError };
  cachedRaw = raw;
  const parsed = parseTenantConfigJson(raw);
  cachedTenants = parsed.tenants;
  cachedError = parsed.error;
  return parsed;
}

export function listTenants(): TenantConfig[] {
  return readTenantRegistry().tenants;
}

export function tenantRegistryError(): string | null {
  return readTenantRegistry().error;
}

export function isLocalDevHost(host: string): boolean {
  const normalized = normalizeHost(host);
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "[::1]" ||
    normalized === "::1"
  );
}

export function getPulsarHosts(): string[] {
  if (dynamicPulsarHosts && dynamicPulsarHosts.length > 0) {
    return [...dynamicPulsarHosts];
  }
  const raw = process.env.PULSAR_HOSTS?.trim();
  if (!raw) return [...DEFAULT_PULSAR_HOSTS];
  const parsed = raw
    .split(",")
    .map((h) => normalizeHost(h))
    .filter((h) => h.length > 0);
  return parsed.length > 0 ? parsed : [...DEFAULT_PULSAR_HOSTS];
}

export function isPulsarHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const normalized = normalizeHost(host);
  if (!normalized) return false;
  return getPulsarHosts().includes(normalized);
}

export function isPulsarRequestFromHeaderGet(
  headerGet: (name: string) => string | null,
): boolean {
  const slug = headerGet(GE_TENANT_HEADER)?.trim().toLowerCase();
  if (slug === PULSAR_SLUG) return true;
  if (slug && slug !== PULSAR_SLUG) return false;

  const raw = headerGet("x-forwarded-host") ?? headerGet("host");
  if (!raw) {
    return process.env.DEV_TENANT_SLUG?.trim().toLowerCase() === PULSAR_SLUG;
  }
  if (isPulsarHost(raw)) return true;
  if (isLocalDevHost(raw)) {
    return process.env.DEV_TENANT_SLUG?.trim().toLowerCase() === PULSAR_SLUG;
  }
  return false;
}

export function resolveTenantByHost(host: string | null | undefined): TenantConfig | null {
  if (!host) return null;
  const normalized = normalizeHost(host);
  if (!normalized || isPulsarHost(normalized)) return null;
  return (
    listTenants().find((tenant) =>
      tenant.hosts.some((candidate) => normalizeHost(candidate) === normalized),
    ) ?? null
  );
}

export function getTenantBySlug(slug: string): TenantConfig | null {
  if (!slug || slug === PULSAR_SLUG) return null;
  return listTenants().find((tenant) => tenant.slug === slug) ?? null;
}

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
  };
}

export function knownMailTenantDomains(): string[] {
  const domains = new Set<string>();
  for (const tenant of listTenants()) {
    if (tenant.mailTenant) domains.add(tenant.mailTenant.toLowerCase());
  }
  return [...domains];
}

/** 404 unknown production hosts. 503 when JSON is set but invalid. Cron and Pulsar host are exempt. */
export function tenantHostBlockStatus(
  headerGet: (name: string) => string | null,
  pathname: string,
): 404 | 503 | null {
  if (!isMultiTenantEnabled()) return null;
  if (pathname === "/api/cron" || pathname.startsWith("/api/cron/")) return null;
  if (isPulsarRequestFromHeaderGet(headerGet)) return null;
  if (tenantRegistryError()) return 503;
  if (tenantFromHeaderGet(headerGet)) return null;
  const host = headerGet("x-forwarded-host") ?? headerGet("host") ?? "";
  if (host && isLocalDevHost(host)) return null;
  return 404;
}

export function tenantFromHeaderGet(
  headerGet: (name: string) => string | null,
): TenantConfig | null {
  if (!isMultiTenantEnabled() || tenantRegistryError()) return null;
  if (isPulsarRequestFromHeaderGet(headerGet)) return null;
  const slug = headerGet(GE_TENANT_HEADER)?.trim();
  if (slug) {
    const bySlug = getTenantBySlug(slug);
    if (bySlug) return bySlug;
  }
  const raw = headerGet("x-forwarded-host") ?? headerGet("host");
  if (!raw) return null;
  if (isLocalDevHost(raw)) {
    const devSlug = process.env.DEV_TENANT_SLUG?.trim();
    if (devSlug) return getTenantBySlug(devSlug);
    return listTenants()[0] ?? null;
  }
  return resolveTenantByHost(raw);
}
