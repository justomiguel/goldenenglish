"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function setRegisterShowAllSections(
  locale: string,
  enabled: boolean,
): Promise<{ ok: boolean }> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("setRegisterShowAllSections");
    return { ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "register_show_all_sections",
      value: enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    logSupabaseClientError("setRegisterShowAllSections", error, {
      key: "register_show_all_sections",
    });
    return { ok: false };
  }

  void recordSystemAudit({
    action: "site_settings_upsert",
    resourceType: "site_settings",
    resourceId: "register_show_all_sections",
    payload: { value: enabled },
  });

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/register`);
  revalidatePath(`/${locale}/dashboard/admin/settings`);
  return { ok: true };
}
