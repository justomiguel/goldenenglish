"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { cefrLevelEnum } from "@/lib/import/studentRowSchema";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";

const idZ = z.string().uuid();

const draftSchema = z.object({
  registration_id: idZ,
  first_name: z.string().trim().min(1).max(120),
  last_name: z.string().trim().min(1).max(120),
  dni: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(320),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((s) => (s == null || s === "" ? null : s)),
  birth_date: z
    .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
    .transform((v) => (v === "" ? null : v)),
  level_interest: z
    .union([z.literal(""), cefrLevelEnum])
    .transform((v) => (v === "" ? null : v)),
  tutor_name: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((s) => (s == null || s === "" ? null : s)),
  tutor_dni: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((s) => (s == null || s === "" ? null : s)),
  tutor_email: z
    .string()
    .trim()
    .max(320)
    .optional()
    .transform((s) => (s == null || s === "" ? null : s))
    .pipe(z.union([z.null(), z.string().email().max(320)])),
  tutor_phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((s) => (s == null || s === "" ? null : s)),
  tutor_relationship: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((s) => (s == null || s === "" ? null : s)),
});

export type RegistrationDraftInput = z.infer<typeof draftSchema>;
export type RegistrationDraftPayload = z.input<typeof draftSchema>;

export async function updateRegistrationDraft(
  locale: string,
  raw: RegistrationDraftPayload,
): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(locale);
  const reg = dict.actionErrors.registrationDraft;
  const regUi = dict.admin.registrations;

  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("updateRegistrationDraft");
    return { ok: false, message: reg.forbidden };
  }

  const parsed = draftSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: reg.invalidData };

  const admin = createAdminClient();
  const { registration_id, ...patch } = parsed.data;

  const { data: row, error: fetchErr } = await admin
    .from("registrations")
    .select("id,status")
    .eq("id", registration_id)
    .maybeSingle();

  if (fetchErr) {
    logSupabaseClientError("updateRegistrationDraft:select", fetchErr, { registrationId: registration_id });
    return { ok: false, message: reg.notFound };
  }
  if (!row) return { ok: false, message: reg.notFound };
  if (row.status !== "new") return { ok: false, message: regUi.alreadyProcessed };

  const { error } = await admin
    .from("registrations")
    .update(patch)
    .eq("id", registration_id)
    .eq("status", "new");

  if (error) {
    logSupabaseClientError("updateRegistrationDraft:update", error, { registrationId: registration_id });
    return { ok: false, message: reg.saveFailed };
  }

  void recordSystemAudit({
    action: "registration_draft_updated",
    resourceType: "registration",
    resourceId: registration_id,
    payload: { fields: Object.keys(patch) },
  });

  revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
  return { ok: true };
}
