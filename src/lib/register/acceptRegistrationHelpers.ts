import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { compensateDeleteStudentAuthUser } from "@/lib/register/compensateStudentAuthUser";
import { localizeRegistrationAcceptError } from "@/lib/register/localizeRegistrationAcceptError";

export const idZ = z.string().uuid();

export const acceptRegistrationSchema = z.object({
  registration_id: idZ,
  password: z.string().max(72).optional(),
  birth_date: z
    .string()
    .trim()
    .optional()
    .transform((s) => (s === "" || s == null ? undefined : s))
    .pipe(z.union([z.undefined(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])),
});

export type AcceptRegistrationInput = z.infer<typeof acceptRegistrationSchema>;

/**
 * If a downstream step fails after the student auth user is created, attempt
 * to roll the user back so the registration stays in a re-acceptable state.
 * Audits both successful compensations and failed rollbacks.
 */
export async function failAfterStudentCreated(
  admin: SupabaseClient,
  registrationId: string,
  studentId: string,
  primaryCode: string,
  dict: Dictionary,
): Promise<{ ok: false; message: string }> {
  const roll = await compensateDeleteStudentAuthUser(admin, studentId);
  if (!roll.ok) {
    void recordSystemAudit({
      action: "registration_accept_rollback_failed",
      resourceType: "registration",
      resourceId: registrationId,
      payload: { student_id: studentId, intended_error: primaryCode },
    });
    return {
      ok: false,
      message: localizeRegistrationAcceptError(dict, "rollback_failed"),
    };
  }
  return { ok: false, message: localizeRegistrationAcceptError(dict, primaryCode) };
}
