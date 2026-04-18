"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, defaultLocale } from "@/lib/i18n/dictionaries";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { resolveTutorStudentLink } from "@/lib/auth/resolveTutorStudentLink";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export interface TutorFinancialAccessResult {
  ok: boolean;
  message?: string;
}

/**
 * Alumno mayor toma una decisión explícita sobre el acceso financiero del tutor:
 * - `revoke`: setea `tutor_student_rel.financial_access_revoked_at = now()` y
 *   `financial_access_revoked_by = auth.uid()`. La RLS impide que el tutor
 *   vuelva a leer/insertar pagos del alumno mientras esté revocado.
 * - `restore`: limpia ambas columnas para volver al estado default-allow.
 *
 * La autorización real vive en RLS (`tutor_student_rel_update_student_adult`),
 * pero validamos también desde la app por defensa en profundidad y para devolver
 * mensajes i18n claros antes de tocar Supabase.
 */
export async function setTutorFinancialAccess(
  formData: FormData,
): Promise<TutorFinancialAccessResult> {
  const localeRaw = String(formData.get("locale") ?? "").trim();
  const locale = localeRaw || defaultLocale;
  const dict = await getDictionary(locale);
  const messages = dict.actionErrors.tutorFinancialAccess;

  const tutorId = String(formData.get("tutorId") ?? "").trim();
  const intent = String(formData.get("intent") ?? "").trim();
  if (!tutorId || (intent !== "revoke" && intent !== "restore")) {
    return { ok: false, message: messages.invalidForm };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: messages.unauthorized };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_minor")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "student") {
    return { ok: false, message: messages.forbidden };
  }
  if (profile?.is_minor === true) {
    return { ok: false, message: messages.minorCannotChange };
  }

  const link = await resolveTutorStudentLink(supabase, tutorId, user.id);
  if (!link.linked) return { ok: false, message: messages.linkNotFound };

  const update =
    intent === "revoke"
      ? {
          financial_access_revoked_at: new Date().toISOString(),
          financial_access_revoked_by: user.id,
        }
      : {
          financial_access_revoked_at: null,
          financial_access_revoked_by: null,
        };

  const { error } = await supabase
    .from("tutor_student_rel")
    .update(update)
    .eq("tutor_id", tutorId)
    .eq("student_id", user.id);

  if (error) {
    logSupabaseClientError("setTutorFinancialAccess:update", error, {
      studentId: user.id,
      tutorId,
      intent,
    });
    return { ok: false, message: messages.updateFailed };
  }

  revalidatePath(`/${locale}/dashboard/profile`);
  revalidatePath(`/${locale}/dashboard/student/payments`);

  void recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity:
      intent === "revoke"
        ? AnalyticsEntity.tutorFinancialAccessRevokedByStudent
        : AnalyticsEntity.tutorFinancialAccessRestoredByStudent,
    metadata: { tutor_id: tutorId },
  });
  return { ok: true };
}
