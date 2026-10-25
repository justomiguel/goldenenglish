import "server-only";
import { NextResponse } from "next/server";
import { logServerException, logServerError } from "@/lib/logging/serverActionLog";
import { runWithTenant } from "@/lib/tenant/tenantAls";
import {
  isMultiTenantEnabled,
  listTenants,
  tenantRegistryError,
} from "@/lib/tenant/tenantRegistry";

/**
 * One Vercel cron hits one host. Run the job once per institute.
 * Single-tenant deploys call `work` once and return its response unchanged.
 */
export async function runCronAcrossTenants(
  work: () => Promise<NextResponse>,
): Promise<NextResponse> {
  if (!isMultiTenantEnabled()) return work();
  const error = tenantRegistryError();
  if (error) {
    logServerError("cron.tenants", { code: error });
    return NextResponse.json({ ok: false, message: "tenant_config_invalid" }, { status: 500 });
  }

  const tenants = listTenants();
  const summaries: { slug: string; status: number }[] = [];
  let failures = 0;
  for (const tenant of tenants) {
    try {
      const response = await runWithTenant(tenant, work);
      summaries.push({ slug: tenant.slug, status: response.status });
      if (!response.ok) failures += 1;
    } catch (err) {
      failures += 1;
      logServerException("cron.tenant", err, { slug: tenant.slug });
      summaries.push({ slug: tenant.slug, status: 500 });
    }
  }

  const status = tenants.length > 0 && failures === tenants.length ? 500 : 200;
  return NextResponse.json(
    { ok: failures === 0, tenants: summaries },
    { status },
  );
}
