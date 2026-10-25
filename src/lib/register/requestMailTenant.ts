import "server-only";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";
import { isMultiTenantEnabled } from "@/lib/tenant/tenantRegistry";
import {
  getRegistrationMailTenantDomain,
  normalizeMailTenantDomain,
} from "@/lib/register/registrationMailTenant";

/** Mail domain for this HTTP request. Single-tenant falls back to `MAIL_TENANT`. */
export async function getRequestMailTenantDomain(): Promise<string | null> {
  const tenant = await resolveRequestTenant();
  const fromTenant = normalizeMailTenantDomain(tenant?.mailTenant);
  if (fromTenant) return fromTenant;
  if (isMultiTenantEnabled()) return null;
  return getRegistrationMailTenantDomain();
}
