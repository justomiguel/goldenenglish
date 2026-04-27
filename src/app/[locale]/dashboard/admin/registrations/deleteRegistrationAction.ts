"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { auditIdentityAction } from "@/lib/audit";

const idZ = z.string().uuid();

export async function deleteRegistration(
  locale: string,
  registrationId: string,
): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(locale);
  const del = dict.actionErrors.registrationDelete;

  let actorId = "";
  try {
    const ctx = await assertAdmin();
    actorId = ctx.user.id;
  } catch {
    logServerAuthzDenied("deleteRegistration");
    return { ok: false, message: del.forbidden };
  }

  const parsed = idZ.safeParse(registrationId);
  if (!parsed.success) return { ok: false, message: del.invalidId };

  const admin = createAdminClient();
  const { data: beforeRegistration } = await admin
    .from("registrations")
    .select("id, first_name, last_name, dni, email, phone, level_interest, status, created_at")
    .eq("id", parsed.data)
    .maybeSingle();
  const { error } = await admin.from("registrations").delete().eq("id", parsed.data);
  if (error) {
    logSupabaseClientError("deleteRegistration", error, { registrationId: parsed.data });
    return { ok: false, message: del.saveFailed };
  }

  void auditIdentityAction({
    actorId,
    actorRole: "admin",
    action: "delete",
    resourceType: "registration",
    resourceId: parsed.data,
    summary: "Admin deleted registration",
    beforeValues: { registration: beforeRegistration ?? null },
    afterValues: { registration: null },
  });
  revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
  return { ok: true };
}
