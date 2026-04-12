"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";

export async function setInscriptionsEnabled(
  locale: string,
  enabled: boolean,
): Promise<{ ok: boolean }> {
  try {
    await assertAdmin();
  } catch {
    return { ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "inscriptions_enabled",
      value: enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) return { ok: false };

  void recordSystemAudit({
    action: "site_settings_upsert",
    resourceType: "site_settings",
    resourceId: "inscriptions_enabled",
    payload: { value: enabled },
  });

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/register`);
  return { ok: true };
}
