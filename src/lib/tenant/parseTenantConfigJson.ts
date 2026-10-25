import type { TenantConfig } from "./tenantRegistry";

/** Host without port, lowercase. Keeps IPv6 brackets. */
export function normalizeHost(host: string): string {
  const first = host.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!first) return "";
  const noPort = first.startsWith("[") ? first : first.replace(/:\d+$/u, "");
  return noPort.endsWith(".") ? noPort.slice(0, -1) : noPort;
}

export function parseTenantConfigJson(raw: string | undefined): {
  tenants: TenantConfig[];
  error: string | null;
} {
  const trimmed = raw?.trim();
  if (!trimmed) return { tenants: [], error: null };
  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch {
    return { tenants: [], error: "invalid_json" };
  }
  if (!Array.isArray(data)) return { tenants: [], error: "not_array" };
  const tenants: TenantConfig[] = [];
  for (const row of data) {
    const parsed = parseTenantRow(row);
    if (!parsed) return { tenants: [], error: "invalid_tenant" };
    tenants.push(parsed);
  }
  const slugs = new Set<string>();
  const hosts = new Set<string>();
  for (const tenant of tenants) {
    if (slugs.has(tenant.slug)) return { tenants: [], error: "duplicate_slug" };
    slugs.add(tenant.slug);
    for (const host of tenant.hosts) {
      const normalized = normalizeHost(host);
      if (hosts.has(normalized)) return { tenants: [], error: "duplicate_host" };
      hosts.add(normalized);
    }
  }
  return { tenants, error: null };
}

export function parseTenantRow(row: unknown): TenantConfig | null {
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  const slug = stringField(record.slug);
  const supabaseUrl = stringField(record.supabaseUrl);
  const supabaseAnonKey = stringField(record.supabaseAnonKey);
  const supabaseServiceRoleKey = stringField(record.supabaseServiceRoleKey);
  const hosts = Array.isArray(record.hosts)
    ? record.hosts.filter((host): host is string => typeof host === "string" && host.trim().length > 0)
    : [];
  if (!slug || !/^[a-z0-9](?:[a-z0-9-]{0,62})$/u.test(slug)) return null;
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || hosts.length === 0) return null;
  return {
    slug,
    hosts,
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    databaseUrl: stringField(record.databaseUrl),
    brandThemeSlug: stringField(record.brandThemeSlug),
    mailTenant: stringField(record.mailTenant),
    resendFromEmail: stringField(record.resendFromEmail),
    resendApiKey: stringField(record.resendApiKey),
    publicUrl: stringField(record.publicUrl),
    paymentGatewaySecretEncryptionKey: stringField(record.paymentGatewaySecretEncryptionKey),
    whatsappAccessToken: stringField(record.whatsappAccessToken),
    whatsappPhoneNumberId: stringField(record.whatsappPhoneNumberId),
    whatsappClassReminderTemplateName: stringField(record.whatsappClassReminderTemplateName),
    vapidPublicKey: stringField(record.vapidPublicKey),
    vapidPrivateKey: stringField(record.vapidPrivateKey),
    vapidContactEmail: stringField(record.vapidContactEmail),
    googleMapsApiKey: stringField(record.googleMapsApiKey),
    googleMapsMapId: stringField(record.googleMapsMapId),
    kvRestApiUrl: stringField(record.kvRestApiUrl),
    kvRestApiToken: stringField(record.kvRestApiToken),
    debugLogin: booleanField(record.debugLogin),
    skipInitialSiteSetup: booleanField(record.skipInitialSiteSetup),
  };
}

function stringField(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function booleanField(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    return lower === "true" || lower === "1";
  }
  return false;
}
