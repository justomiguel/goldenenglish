import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Vista de dominio sobre el vínculo `tutor_student_rel` para un par
 * `(tutorId, studentId)`. Mantiene la decisión "default-allow + opt-out":
 * `linked` indica si existe el vínculo y `financialAccessActive` cubre la
 * puerta de privacidad real (alumno mayor puede revocar acceso financiero).
 */
export interface TutorStudentLink {
  /** Existe la fila en `public.tutor_student_rel`. */
  linked: boolean;
  /** El tutor puede ver / actuar sobre la situación financiera del alumno. */
  financialAccessActive: boolean;
  /** Marca temporal de la revocación (NULL = activo). */
  financialAccessRevokedAt: string | null;
  /** Quién revocó (alumno o admin). NULL cuando nunca se revocó. */
  financialAccessRevokedBy: string | null;
  /** El alumno está marcado como menor de edad en `profiles.is_minor`. */
  studentIsMinor: boolean;
}

const REVOKED_LINK: TutorStudentLink = {
  linked: false,
  financialAccessActive: false,
  financialAccessRevokedAt: null,
  financialAccessRevokedBy: null,
  studentIsMinor: false,
};

/**
 * Resuelve el vínculo financiero entre un tutor y un alumno. Devuelve un
 * objeto con flags estables para que server actions y loaders compartan la
 * misma lógica de autorización (sin reescribir EXISTS por todos lados).
 */
export async function resolveTutorStudentLink(
  supabase: SupabaseClient,
  tutorId: string,
  studentId: string,
): Promise<TutorStudentLink> {
  if (!tutorId || !studentId || tutorId === studentId) return REVOKED_LINK;

  const { data: link } = await supabase
    .from("tutor_student_rel")
    .select(
      "tutor_id, student_id, financial_access_revoked_at, financial_access_revoked_by",
    )
    .eq("tutor_id", tutorId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!link) return REVOKED_LINK;

  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("is_minor")
    .eq("id", studentId)
    .maybeSingle();

  const revokedAt = (link.financial_access_revoked_at as string | null) ?? null;
  return {
    linked: true,
    financialAccessActive: revokedAt === null,
    financialAccessRevokedAt: revokedAt,
    financialAccessRevokedBy:
      (link.financial_access_revoked_by as string | null) ?? null,
    studentIsMinor: Boolean(studentProfile?.is_minor),
  };
}
