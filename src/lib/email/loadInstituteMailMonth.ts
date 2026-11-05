import "server-only";

import { loadFleetMailMonth, type MailMonthReadout } from "@/lib/email/resendMonthlyMail";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

export async function loadInstituteMailMonth(): Promise<MailMonthReadout> {
  const tenant = await resolveRequestTenant();
  if (!tenant) return { source: "unread" };
  const bySlug = await loadFleetMailMonth([
    {
      slug: tenant.slug,
      resendApiKey: tenant.resendApiKey,
      pulsarMailSent: tenant.pulsarMailSent,
      pulsarMailQuota: tenant.pulsarMailQuota,
    },
  ]);
  return bySlug[tenant.slug] ?? { source: "unread" };
}
