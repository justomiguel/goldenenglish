import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";

/** Institute settings that a restore needs. Shared Pulsar credentials stay out. */
export function tenantBackupDocument(tenant: PulsarTenantRecord): Record<string, unknown> {
  return {
    slug: tenant.slug,
    displayName: tenant.displayName,
    isEnabled: tenant.isEnabled,
    hosts: tenant.hosts,
    publicUrl: tenant.publicUrl,
    brandThemeSlug: tenant.brandThemeSlug,
    mailTenant: tenant.mailTenant,
    resendFromEmail: tenant.resendFromEmail,
    resendApiKey: tenant.resendApiKey,
    paymentGatewaySecretEncryptionKey: tenant.paymentGatewaySecretEncryptionKey,
    whatsappAccessToken: tenant.whatsappAccessToken,
    whatsappPhoneNumberId: tenant.whatsappPhoneNumberId,
    whatsappClassReminderTemplateName: tenant.whatsappClassReminderTemplateName,
    vapidPublicKey: tenant.vapidPublicKey,
    vapidPrivateKey: tenant.vapidPrivateKey,
    vapidContactEmail: tenant.vapidContactEmail,
    googleMapsApiKey: tenant.googleMapsApiKey,
    googleMapsMapId: tenant.googleMapsMapId,
    kvRestApiUrl: tenant.kvRestApiUrl,
    kvRestApiToken: tenant.kvRestApiToken,
    debugLogin: tenant.debugLogin,
    skipInitialSiteSetup: tenant.skipInitialSiteSetup,
    commercialPlan: tenant.commercialPlan ?? null,
    dailyApiKey: tenant.dailyApiKey ?? null,
    dailyDomain: tenant.dailyDomain ?? null,
    pulsarMailQuota: tenant.pulsarMailQuota ?? null,
    pulsarMailSent: tenant.pulsarMailSent ?? null,
    dataMode: "shared_schema",
    postgresSchema: tenant.postgresSchema,
  };
}

const SHARED_KEYS = ["supabaseUrl", "supabaseAnonKey", "supabaseServiceRoleKey", "databaseUrl"];

export function documentOmitsSharedCredentials(document: Record<string, unknown>): boolean {
  return SHARED_KEYS.every((key) => !(key in document));
}
