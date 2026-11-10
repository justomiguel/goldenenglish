import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";
import { parseCommercialPlan } from "@/lib/pulsar/commercialPlan";
import { parseDailyDomain } from "@/lib/pulsar/dailyDomain";
import { DEFAULT_PULSAR_MAIL_QUOTA } from "@/lib/pulsar/instituteMailAccount";
import { INSTITUTE_SCHEMA } from "@/lib/pulsar/tenantDeleteScope";
import type { SharedPulsarCredentials } from "@/lib/pulsar/pulsarTenantSchema";

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function whole(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : fallback;
}

/** Builds the row insert from the file plus the current Pulsar credentials. */
export function tenantRecordFromBackup(
  document: Record<string, unknown>,
  shared: SharedPulsarCredentials,
): Omit<PulsarTenantRecord, "updatedAt"> | null {
  const slug = text(document.slug)?.toLowerCase() ?? "";
  const schema = text(document.postgresSchema) ?? "";
  if (!/^[a-z0-9](?:[a-z0-9-]{0,62})$/.test(slug) || !INSTITUTE_SCHEMA.test(schema)) return null;
  if (document.dataMode !== "shared_schema") return null;
  const hosts = Array.isArray(document.hosts) ? document.hosts.map(String) : [];
  return {
    slug,
    displayName: text(document.displayName) ?? slug,
    isEnabled: document.isEnabled !== false,
    hosts,
    supabaseUrl: shared.url,
    supabaseAnonKey: shared.anonKey,
    supabaseServiceRoleKey: shared.serviceRoleKey,
    databaseUrl: shared.databaseUrl,
    brandThemeSlug: text(document.brandThemeSlug),
    mailTenant: text(document.mailTenant),
    resendFromEmail: text(document.resendFromEmail),
    resendApiKey: text(document.resendApiKey),
    publicUrl: text(document.publicUrl),
    paymentGatewaySecretEncryptionKey: text(document.paymentGatewaySecretEncryptionKey),
    whatsappAccessToken: text(document.whatsappAccessToken),
    whatsappPhoneNumberId: text(document.whatsappPhoneNumberId),
    whatsappClassReminderTemplateName: text(document.whatsappClassReminderTemplateName),
    vapidPublicKey: text(document.vapidPublicKey),
    vapidPrivateKey: text(document.vapidPrivateKey),
    vapidContactEmail: text(document.vapidContactEmail),
    googleMapsApiKey: text(document.googleMapsApiKey),
    googleMapsMapId: text(document.googleMapsMapId),
    kvRestApiUrl: text(document.kvRestApiUrl),
    kvRestApiToken: text(document.kvRestApiToken),
    debugLogin: document.debugLogin === true,
    skipInitialSiteSetup: document.skipInitialSiteSetup !== false,
    commercialPlan: parseCommercialPlan(document.commercialPlan),
    dailyApiKey: text(document.dailyApiKey),
    dailyDomain: parseDailyDomain(document.dailyDomain),
    pulsarMailQuota: whole(document.pulsarMailQuota, DEFAULT_PULSAR_MAIL_QUOTA),
    pulsarMailSent: whole(document.pulsarMailSent, 0),
    dataMode: "shared_schema",
    postgresSchema: schema,
  };
}
