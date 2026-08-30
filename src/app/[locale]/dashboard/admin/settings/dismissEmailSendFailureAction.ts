"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";
import { dismissEmailSendStaffNotice } from "@/lib/email/emailSendStaffNotice";

export async function dismissEmailSendFailureAction(locale: string): Promise<{ ok: boolean }> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("dismissEmailSendFailureAction");
    return { ok: false };
  }
  const supabase = await createClient();
  const ok = await dismissEmailSendStaffNotice(supabase);
  if (ok) revalidatePath(`/${locale}/dashboard/admin`, "layout");
  return { ok };
}
