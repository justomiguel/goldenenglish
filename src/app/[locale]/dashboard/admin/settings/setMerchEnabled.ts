"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function setMerchEnabled(
  locale: string,
  enabled: boolean,
): Promise<{ ok: boolean }> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("setMerchEnabled");
    return { ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "merch_enabled",
      value: enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    logSupabaseClientError("setMerchEnabled", error, { key: "merch_enabled" });
    return { ok: false };
  }

  void recordSystemAudit({
    action: "site_settings_upsert",
    resourceType: "site_settings",
    resourceId: "merch_enabled",
    payload: { value: enabled },
  });

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/tienda`);
  revalidatePath(`/${locale}/dashboard/admin/merch`);
  return { ok: true };
}
