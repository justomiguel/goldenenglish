import { DEFAULT_PULSAR_MAIL_QUOTA } from "@/lib/pulsar/instituteMailAccount";
import { normalizeHost, type TenantConfig } from "@/lib/tenant/tenantRegistry";

export type PulsarTenantRecord = TenantConfig & {
  displayName: string;
  isEnabled: boolean;
  updatedAt: string | null;
};

export const PLATFORM_TENANTS_SELECT_COLUMNS =
  "slug, display_name, is_enabled, hosts, supabase_url, supabase_anon_key, supabase_service_role_key, database_url, brand_theme_slug, mail_tenant, resend_from_email, resend_api_key, public_url, payment_gateway_secret_encryption_key, whatsapp_access_token, whatsapp_phone_number_id, whatsapp_class_reminder_template_name, vapid_public_key, vapid_private_key, vapid_contact_email, google_maps_api_key, google_maps_map_id, kv_rest_api_url, kv_rest_api_token, debug_login, skip_initial_site_setup, updated_at";

export const PLATFORM_TENANTS_SELECT_WITH_DATA_PLANE = `${PLATFORM_TENANTS_SELECT_COLUMNS}, data_mode, postgres_schema`;

export const PLATFORM_TENANTS_SELECT_WITH_MAIL = `${PLATFORM_TENANTS_SELECT_WITH_DATA_PLANE}, pulsar_mail_quota, pulsar_mail_sent`;

function wholeNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === "string" && /^\d+$/u.test(value.trim())) return Number(value.trim());
  return fallback;
}

function strOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export function mapDbRowToPulsarTenantRecord(row: Record<string, unknown>): PulsarTenantRecord | null {
  const slug = strOrNull(row.slug)?.toLowerCase() ?? null;
  const supabaseUrl = strOrNull(row.supabase_url);
  const supabaseAnonKey = strOrNull(row.supabase_anon_key);
  const supabaseServiceRoleKey = strOrNull(row.supabase_service_role_key);
  const hosts = Array.isArray(row.hosts)
    ? row.hosts
        .filter((h): h is string => typeof h === "string")
        .map((h) => normalizeHost(h))
        .filter((h) => h.length > 0)
    : [];

  if (!slug || !supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || hosts.length === 0) {
    return null;
  }

  return {
    slug,
    displayName: strOrNull(row.display_name) ?? slug.toUpperCase(),
    isEnabled: row.is_enabled !== false,
    updatedAt: strOrNull(row.updated_at),
    hosts,
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    databaseUrl: strOrNull(row.database_url),
    brandThemeSlug: strOrNull(row.brand_theme_slug),
    mailTenant: strOrNull(row.mail_tenant),
    resendFromEmail: strOrNull(row.resend_from_email),
    resendApiKey: strOrNull(row.resend_api_key),
    publicUrl: strOrNull(row.public_url),
    paymentGatewaySecretEncryptionKey: strOrNull(row.payment_gateway_secret_encryption_key),
    whatsappAccessToken: strOrNull(row.whatsapp_access_token),
    whatsappPhoneNumberId: strOrNull(row.whatsapp_phone_number_id),
    whatsappClassReminderTemplateName: strOrNull(row.whatsapp_class_reminder_template_name),
    vapidPublicKey: strOrNull(row.vapid_public_key),
    vapidPrivateKey: strOrNull(row.vapid_private_key),
    vapidContactEmail: strOrNull(row.vapid_contact_email),
    googleMapsApiKey: strOrNull(row.google_maps_api_key),
    googleMapsMapId: strOrNull(row.google_maps_map_id),
    kvRestApiUrl: strOrNull(row.kv_rest_api_url),
    kvRestApiToken: strOrNull(row.kv_rest_api_token),
    debugLogin: Boolean(row.debug_login),
    skipInitialSiteSetup: Boolean(row.skip_initial_site_setup),
    pulsarMailQuota: wholeNumber(row.pulsar_mail_quota, DEFAULT_PULSAR_MAIL_QUOTA),
    pulsarMailSent: wholeNumber(row.pulsar_mail_sent, 0),
    dataMode: row.data_mode === "shared_schema" ? "shared_schema" : "project",
    postgresSchema:
      row.data_mode === "shared_schema"
        ? strOrNull(row.postgres_schema) ?? "public"
        : "public",
  };
}

export function mapPulsarTenantToDbPayload(record: Omit<PulsarTenantRecord, "updatedAt">): Record<string, unknown> {
  return {
    slug: record.slug,
    display_name: record.displayName,
    is_enabled: record.isEnabled,
    hosts: record.hosts,
    supabase_url: record.supabaseUrl,
    supabase_anon_key: record.supabaseAnonKey,
    supabase_service_role_key: record.supabaseServiceRoleKey,
    database_url: record.databaseUrl,
    brand_theme_slug: record.brandThemeSlug,
    mail_tenant: record.mailTenant,
    resend_from_email: record.resendFromEmail,
    resend_api_key: record.resendApiKey,
    public_url: record.publicUrl,
    payment_gateway_secret_encryption_key: record.paymentGatewaySecretEncryptionKey,
    whatsapp_access_token: record.whatsappAccessToken,
    whatsapp_phone_number_id: record.whatsappPhoneNumberId,
    whatsapp_class_reminder_template_name: record.whatsappClassReminderTemplateName,
    vapid_public_key: record.vapidPublicKey,
    vapid_private_key: record.vapidPrivateKey,
    vapid_contact_email: record.vapidContactEmail,
    google_maps_api_key: record.googleMapsApiKey,
    google_maps_map_id: record.googleMapsMapId,
    kv_rest_api_url: record.kvRestApiUrl,
    kv_rest_api_token: record.kvRestApiToken,
    debug_login: record.debugLogin,
    skip_initial_site_setup: record.skipInitialSiteSetup,
    pulsar_mail_quota: record.pulsarMailQuota ?? DEFAULT_PULSAR_MAIL_QUOTA,
    data_mode: record.dataMode === "shared_schema" ? "shared_schema" : "project",
    postgres_schema:
      record.dataMode === "shared_schema" ? record.postgresSchema ?? "public" : "public",
    updated_at: new Date().toISOString(),
  };
}

export function mapTenantConfigToPulsarRecord(tenant: TenantConfig): PulsarTenantRecord {
  const hostLabel = tenant.hosts[0] ?? tenant.slug;
  return {
    ...tenant,
    displayName: `${tenant.slug.toUpperCase()} (${hostLabel})`,
    isEnabled: true,
    updatedAt: null,
  };
}
