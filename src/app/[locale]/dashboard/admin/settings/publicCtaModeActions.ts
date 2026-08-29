"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  parsePublicCtaMode,
  PUBLIC_CTA_MODES,
  type PublicCtaMode,
} from "@/lib/settings/parsePublicCtaMode";

export async function setPublicCtaMode(
  locale: string,
  mode: string,
): Promise<{ ok: boolean }> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("setPublicCtaMode");
    return { ok: false };
  }

  const parsed = parsePublicCtaMode(mode);
  if (!PUBLIC_CTA_MODES.includes(mode as PublicCtaMode)) {
    return { ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "public_cta_mode",
      value: parsed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    logSupabaseClientError("setPublicCtaMode", error, { key: "public_cta_mode" });
    return { ok: false };
  }

  void recordSystemAudit({
    action: "site_settings_upsert",
    resourceType: "site_settings",
    resourceId: "public_cta_mode",
    payload: { value: parsed },
  });

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/register`);
  revalidatePath(`/${locale}/dashboard/admin/settings`);
  return { ok: true };
}
