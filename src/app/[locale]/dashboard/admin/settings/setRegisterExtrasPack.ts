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
  parseRegisterExtrasPack,
  type RegisterExtrasPack,
} from "@/lib/register/packs/registerExtrasPack";

export async function setRegisterExtrasPack(
  locale: string,
  pack: RegisterExtrasPack | null,
): Promise<{ ok: true } | { ok: false; code: "forbidden" | "invalid_input" | "persist_failed" }> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("setRegisterExtrasPack");
    return { ok: false, code: "forbidden" };
  }

  if (pack !== null && parseRegisterExtrasPack(pack) == null) {
    void logServerWarn("setRegisterExtrasPack", { reason: "validation", code: "invalid_input" });
    return { ok: false, code: "invalid_input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "register.extras_pack",
      value: pack,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    logSupabaseClientError("setRegisterExtrasPack", error, {
      key: "register.extras_pack",
      code: "persist_failed",
    });
    return { ok: false, code: "persist_failed" };
  }

  void recordSystemAudit({
    action: "site_settings_upsert",
    resourceType: "site_settings",
    resourceId: "register.extras_pack",
    payload: { value: pack },
  });

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/register`);
  revalidatePath(`/${locale}/dashboard/admin/settings`);
  revalidatePath(`/${locale}/dashboard/admin/registrations`);
  return { ok: true };
}
