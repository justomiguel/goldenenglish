import type { CommercialPlan } from "@/lib/pulsar/commercialPlan";
import { parseCommercialPlan } from "@/lib/pulsar/commercialPlan";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

export type { SectionDeliveryMode } from "@/lib/academics/sectionDeliveryMode";
export { parseDeliveryMode } from "@/lib/academics/sectionDeliveryMode";

export function tenantDailyCredentials(
  tenant: { dailyApiKey?: string | null; dailyDomain?: string | null } | null,
): { apiKey: string; domain: string } | null {
  const apiKey = tenant?.dailyApiKey?.trim() ?? "";
  const domain = tenant?.dailyDomain?.trim() ?? "";
  if (!apiKey || !domain) return null;
  return { apiKey, domain };
}

export async function loadSectionDailyTenantFlags(): Promise<{
  commercialPlan: CommercialPlan;
  dailyCredentialsReady: boolean;
}> {
  const tenant = await resolveRequestTenant();
  return {
    commercialPlan: parseCommercialPlan(tenant?.commercialPlan),
    dailyCredentialsReady: tenantDailyCredentials(tenant) !== null,
  };
}
