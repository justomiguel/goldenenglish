import { DEFAULT_GENERIC_THEME_SLUG } from "@/lib/theme/genericInstituteTemplates";
import type { PulsarTenantFormValues } from "@/components/organisms/pulsar/PulsarAdminTenantFieldGroups";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";
import { normalizeHost } from "@/lib/tenant/parseTenantConfigJson";
import { previewHostsForTenantSlug } from "@/lib/tenant/pulsarSubdomain";

function customHosts(tenant: PulsarTenantRecord | null | undefined, pulsarHosts: readonly string[]): string {
  if (!tenant) return "";
  const preview = new Set(previewHostsForTenantSlug(tenant.slug, pulsarHosts));
  return tenant.hosts
    .map((host) => normalizeHost(host))
    .filter((host) => host.length > 0 && !preview.has(host))
    .join(", ");
}

export function toPulsarTenantFormValues(
  tenant?: PulsarTenantRecord | null,
  pulsarHosts: readonly string[] = [],
): PulsarTenantFormValues {
  return {
    slug: tenant?.slug ?? "",
    displayName: tenant?.displayName ?? "",
    isEnabled: tenant ? tenant.isEnabled : true,
    hosts: customHosts(tenant, pulsarHosts),
    publicUrl: tenant?.publicUrl ?? "",
    brandThemeSlug: tenant ? (tenant.brandThemeSlug ?? "") : DEFAULT_GENERIC_THEME_SLUG,
    skipInitialSiteSetup: tenant?.skipInitialSiteSetup ?? false,
    debugLogin: tenant?.debugLogin ?? false,
    supabaseUrl: tenant?.supabaseUrl ?? "",
    supabaseAnonKey: tenant?.supabaseAnonKey ?? "",
    supabaseServiceRoleKey: tenant?.supabaseServiceRoleKey ?? "",
    databaseUrl: tenant?.databaseUrl ?? "",
    mailTenant: tenant?.mailTenant ?? "",
    resendFromEmail: tenant?.resendFromEmail ?? "",
    resendApiKey: tenant?.resendApiKey ?? "",
    paymentGatewaySecretEncryptionKey: tenant?.paymentGatewaySecretEncryptionKey ?? "",
    kvRestApiUrl: tenant?.kvRestApiUrl ?? "",
    kvRestApiToken: tenant?.kvRestApiToken ?? "",
    googleMapsApiKey: tenant?.googleMapsApiKey ?? "",
    googleMapsMapId: tenant?.googleMapsMapId ?? "",
    vapidPublicKey: tenant?.vapidPublicKey ?? "",
    vapidPrivateKey: tenant?.vapidPrivateKey ?? "",
    vapidContactEmail: tenant?.vapidContactEmail ?? "",
    whatsappAccessToken: tenant?.whatsappAccessToken ?? "",
    whatsappPhoneNumberId: tenant?.whatsappPhoneNumberId ?? "",
    whatsappClassReminderTemplateName: tenant?.whatsappClassReminderTemplateName ?? "",
    pulsarMailQuota: String(tenant?.pulsarMailQuota ?? 50),
    dataMode: !tenant
      ? "shared_schema"
      : tenant.dataMode === "shared_schema"
        ? "shared_schema"
        : "project",
  };
}
