"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import {
  logServerAuthzDenied,
  logServerWarn,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import {
  isRegisterSectionMode,
  type RegisterSectionMode,
} from "@/lib/settings/registerSectionMode";

export async function setRegisterSectionMode(
  locale: string,
  mode: RegisterSectionMode,
): Promise<{ ok: boolean }> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("setRegisterSectionMode");
    return { ok: false };
  }

  if (!isRegisterSectionMode(mode)) {
    void logServerWarn("setRegisterSectionMode", { reason: "validation", mode });
    return { ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "register_section_mode",
      value: mode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    logSupabaseClientError("setRegisterSectionMode", error, {
      key: "register_section_mode",
    });
    return { ok: false };
  }

  void recordSystemAudit({
    action: "site_settings_upsert",
    resourceType: "site_settings",
    resourceId: "register_section_mode",
    payload: { value: mode },
  });

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/register`);
  revalidatePath(`/${locale}/dashboard/admin/settings`);
  return { ok: true };
}
