import type { SupabaseClient } from "@supabase/supabase-js";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

/**
 * Vista del tutor enlazado a un alumno para la sección de privacidad del
 * perfil del alumno. Espejo de `listTutorStudentsWithFinance`, pero invierte
 * la relación: estudiante → tutores.
 */
export interface StudentTutorSummary {
  tutorId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  financialAccessActive: boolean;
  financialAccessRevokedAt: string | null;
}

const MAX_LINKED_TUTORS = 50;

interface RelRow {
  tutor_id: string;
  financial_access_revoked_at: string | null;
}

interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

function buildDisplayName(first: string | null, last: string | null): string {
  return formatProfileNameSurnameFirst(first, last);
}

export async function listStudentTutorsWithFinance(
  supabase: SupabaseClient,
  studentId: string,
): Promise<StudentTutorSummary[]> {
  if (!studentId) return [];

  const { data: links } = await supabase
    .from("tutor_student_rel")
    .select("tutor_id, financial_access_revoked_at")
    .eq("student_id", studentId)
    .order("tutor_id", { ascending: true })
    .limit(MAX_LINKED_TUTORS);

  const rows = (links ?? []) as RelRow[];
  if (rows.length === 0) return [];

  const tutorIds = rows.map((row) => row.tutor_id);
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", tutorIds);

  const profilesById = new Map<string, ProfileRow>();
  for (const profile of (profileRows ?? []) as ProfileRow[]) {
    profilesById.set(profile.id, profile);
  }

  const summaries = rows.map<StudentTutorSummary>((row) => {
    const profile = profilesById.get(row.tutor_id);
    const first = profile?.first_name ?? null;
    const last = profile?.last_name ?? null;
    const display = buildDisplayName(first, last);
    return {
      tutorId: row.tutor_id,
      firstName: first ?? "",
      lastName: last ?? "",
      displayName: display || row.tutor_id,
      financialAccessActive: row.financial_access_revoked_at === null,
      financialAccessRevokedAt: row.financial_access_revoked_at ?? null,
    };
  });

  summaries.sort((a, b) =>
    a.displayName.toLocaleLowerCase().localeCompare(b.displayName.toLocaleLowerCase()),
  );
  return summaries;
}
