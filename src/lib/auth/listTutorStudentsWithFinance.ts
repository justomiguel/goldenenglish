import type { SupabaseClient } from "@supabase/supabase-js";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

/**
 * Resumen del alumno enlazado para mostrar en la UI del tutor: nombre / id +
 * estado del acceso financiero. La lista se acota por negocio (un tutor rara
 * vez tiene muchos alumnos), pero respetamos el techo razonable y orden
 * estable para alinear con `13-postgrest-pagination-bounded-queries.mdc`.
 */
export interface TutorStudentSummary {
  studentId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  isMinor: boolean;
  financialAccessActive: boolean;
  financialAccessRevokedAt: string | null;
}

const MAX_LINKED_STUDENTS = 200;

interface RelRow {
  student_id: string;
  financial_access_revoked_at: string | null;
}

interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  is_minor: boolean | null;
}

function buildDisplayName(first: string | null, last: string | null): string {
  return formatProfileNameSurnameFirst(first, last);
}

/**
 * Devuelve los alumnos vinculados al tutor con la información necesaria para
 * pintar el picker y cualquier banner de "acceso revocado por el alumno".
 * No filtra por `financial_access_revoked_at IS NULL`: la UI necesita ambos
 * estados para indicar al tutor por qué un alumno no aparece en la tira.
 */
export async function listTutorStudentsWithFinance(
  supabase: SupabaseClient,
  tutorId: string,
): Promise<TutorStudentSummary[]> {
  if (!tutorId) return [];

  const { data: links } = await supabase
    .from("tutor_student_rel")
    .select("student_id, financial_access_revoked_at")
    .eq("tutor_id", tutorId)
    .order("student_id", { ascending: true })
    .limit(MAX_LINKED_STUDENTS);

  const rows = (links ?? []) as RelRow[];
  if (rows.length === 0) return [];

  const studentIds = rows.map((row) => row.student_id);
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, is_minor")
    .in("id", studentIds);

  const profilesById = new Map<string, ProfileRow>();
  for (const profile of (profileRows ?? []) as ProfileRow[]) {
    profilesById.set(profile.id, profile);
  }

  const summaries = rows.map<TutorStudentSummary>((row) => {
    const profile = profilesById.get(row.student_id);
    const first = profile?.first_name ?? null;
    const last = profile?.last_name ?? null;
    return {
      studentId: row.student_id,
      firstName: first ?? "",
      lastName: last ?? "",
      displayName: buildDisplayName(first, last),
      isMinor: Boolean(profile?.is_minor),
      financialAccessActive: row.financial_access_revoked_at === null,
      financialAccessRevokedAt: row.financial_access_revoked_at ?? null,
    };
  });

  summaries.sort((a, b) => {
    const left = a.displayName.toLocaleLowerCase();
    const right = b.displayName.toLocaleLowerCase();
    return left.localeCompare(right);
  });
  return summaries;
}
