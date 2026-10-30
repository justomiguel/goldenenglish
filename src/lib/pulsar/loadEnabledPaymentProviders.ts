import "server-only";

import { logServerWarn } from "@/lib/logging/serverActionLog";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";
import { createAdminClientFromCredentials } from "@/lib/supabase/admin";

const MISSING = new Set(["42P01", "PGRST205"]);

/** Enabled payment providers for one institute. Secrets stay on the row. */
export async function loadEnabledPaymentProviders(tenant: PulsarTenantRecord): Promise<string[]> {
  if (tenant.dataMode === "shared_schema") return [];
  try {
    const client = createAdminClientFromCredentials(tenant.supabaseUrl, tenant.supabaseServiceRoleKey);
    const res = await client
      .from("payment_gateway_credentials")
      .select("provider")
      .eq("enabled", true)
      .limit(8);
    if (res.error) {
      const code = String(res.error.code ?? "gateway_read_failed");
      if (!MISSING.has(code)) {
        logServerWarn("loadEnabledPaymentProviders", { slug: tenant.slug, code });
      }
      return [];
    }
    return (res.data ?? []).map((row) => String(row.provider ?? "")).filter(Boolean);
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String(err.code) : "gateway_read_failed";
    logServerWarn("loadEnabledPaymentProviders", { slug: tenant.slug, code });
    return [];
  }
}
