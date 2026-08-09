"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary, defaultLocale, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import {
  logServerAuthzDenied,
  logServerActionException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const S = "saveStudentCareNotesAction";

const CARE_NOTE_MAX = 2000;

const noteZ = z.string().trim().max(CARE_NOTE_MAX);

const careNotesSchema = z.object({
  locale: z.string().min(2).max(8),
  targetUserId: z.string().uuid(),
  healthNote: noteZ,
  dietNote: noteZ,
  supportNote: noteZ,
});

/** An emptied textarea clears the note; the column stores NULL, not "". */
function toStoredNote(value: string): string | null {
  return value === "" ? null : value;
}

export async function saveStudentCareNotesAction(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  let locale: AppLocale = defaultLocale;
  try {
    const parsed = careNotesSchema.safeParse(raw);
    if (!parsed.success) {
      const dict = await getDictionary(defaultLocale);
      return { ok: false, message: dict.admin.users.detailErrInvalid };
    }
    locale = locales.includes(parsed.data.locale as AppLocale)
      ? (parsed.data.locale as AppLocale)
      : defaultLocale;
    const dict = await getDictionary(locale);

    let adminId: string;
    try {
      const { user } = await assertAdmin();
      adminId = user.id;
    } catch {
      logServerAuthzDenied(S, { targetUserId: parsed.data.targetUserId });
      return { ok: false, message: dict.admin.users.detailErrForbidden };
    }

    const admin = createAdminClient();

    // Care notes belong to a student's file; refuse anything else rather than
    // quietly writing columns nobody will ever read.
    const { data: target } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", parsed.data.targetUserId)
      .maybeSingle();
    const targetRow = target as { id: string; role: string | null } | null;
    if (!targetRow || targetRow.role !== "student") {
      return { ok: false, message: dict.admin.users.detailErrInvalid };
    }

    const healthNote = toStoredNote(parsed.data.healthNote);
    const dietNote = toStoredNote(parsed.data.dietNote);
    const supportNote = toStoredNote(parsed.data.supportNote);

    // has_care_notes is deliberately absent: the trigger from migration 181 owns it.
    const { error } = await admin
      .from("profiles")
      .update({
        care_health_note: healthNote,
        care_diet_note: dietNote,
        care_support_note: supportNote,
        care_updated_at: new Date().toISOString(),
        care_updated_by: adminId,
      })
      .eq("id", parsed.data.targetUserId);

    if (error) {
      logSupabaseClientError(`${S}:profilesUpdateCareNotes`, error, {
        targetUserId: parsed.data.targetUserId,
      });
      return { ok: false, message: dict.admin.users.detailErrCareSave };
    }

    // Booleans only. The audit trail records that care information changed, not
    // what it says.
    void recordSystemAudit({
      action: "student_care_notes_update",
      resourceType: "profiles",
      resourceId: parsed.data.targetUserId,
      payload: {
        healthPresent: healthNote !== null,
        dietPresent: dietNote !== null,
        supportPresent: supportNote !== null,
      },
    });

    revalidatePath(`/${locale}/dashboard/admin/users/${parsed.data.targetUserId}`);
    return { ok: true, message: dict.admin.users.detailCareSaved };
  } catch (e) {
    logServerActionException(S, e, { op: "saveStudentCareNotes" });
    const dict = await getDictionary(locale);
    return { ok: false, message: dict.admin.users.detailErrCareSave };
  }
}
