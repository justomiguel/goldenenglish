import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { loadTeacherSectionIdsForUser } from "@/lib/academics/loadTeacherSectionIdsForUser";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { resolveCareViewerRole, type CareViewerRole } from "@/lib/students/care/careViewerAccess";

/**
 * The only door to a student's care notes.
 *
 * Migration 181 took `SELECT` on the three note columns away from the API roles,
 * so no RLS policy and no ordinary query can reach them: the read below uses the
 * service client, and it only happens once `resolveCareViewerRole` has said yes.
 * Anything that needs this text must come through here.
 */

const SCOPE = "loadStudentCareNotes";

const NOTE_COLUMNS =
  "care_health_note, care_diet_note, care_support_note, care_updated_at, care_updated_by";

export type StudentCareNotes = {
  healthNote: string | null;
  dietNote: string | null;
  supportNote: string | null;
  updatedAt: string | null;
  updatedByName: string | null;
};

export type LoadStudentCareNotesResult =
  | { ok: true; notes: StudentCareNotes; viewerRole: CareViewerRole }
  | { ok: false; reason: "forbidden" | "not_found" | "failed" };

type CareNoteRow = {
  care_health_note: string | null;
  care_diet_note: string | null;
  care_support_note: string | null;
  care_updated_at: string | null;
  care_updated_by: string | null;
};

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

export async function loadStudentCareNotes(
  viewerId: string,
  studentId: string,
): Promise<LoadStudentCareNotesResult> {
  const supabase = await createClient();
  const isStudentThemselves = viewerId === studentId;

  const isAdmin = await resolveIsAdminSession(supabase, viewerId);

  // An admin is already through; skip the two extra round trips.
  let isTutorOfStudent = false;
  let sharesSectionWithStudent = false;
  if (!isAdmin && !isStudentThemselves) {
    const { data: tutorLinks } = await supabase
      .from("tutor_student_rel")
      .select("student_id")
      .eq("tutor_id", viewerId)
      .eq("student_id", studentId)
      .limit(1);
    isTutorOfStudent = (tutorLinks ?? []).length > 0;

    if (!isTutorOfStudent) {
      const [{ data: enrollments }, viewerSectionIds] = await Promise.all([
        supabase.from("section_enrollments").select("section_id").eq("student_id", studentId),
        loadTeacherSectionIdsForUser(supabase, viewerId),
      ]);
      const studentSectionIds = new Set(
        ((enrollments ?? []) as { section_id: string | null }[])
          .map((row) => row.section_id)
          .filter((id): id is string => Boolean(id)),
      );
      sharesSectionWithStudent = viewerSectionIds.some((id) => studentSectionIds.has(id));
    }
  }

  const viewerRole = resolveCareViewerRole({
    isAdmin,
    isTutorOfStudent,
    sharesSectionWithStudent,
    isStudentThemselves,
  });

  if (!viewerRole) {
    logServerAuthzDenied(SCOPE, { studentId });
    return { ok: false, reason: "forbidden" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select(NOTE_COLUMNS)
    .eq("id", studentId)
    .maybeSingle();

  if (error) return { ok: false, reason: "failed" };
  if (!data) return { ok: false, reason: "not_found" };

  const row = data as unknown as CareNoteRow;

  let updatedByName: string | null = null;
  if (row.care_updated_by) {
    const { data: editor } = await admin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", row.care_updated_by)
      .maybeSingle();
    const editorRow = editor as { first_name: string | null; last_name: string | null } | null;
    updatedByName = editorRow
      ? formatProfileNameSurnameFirst(editorRow.first_name, editorRow.last_name) || null
      : null;
  }

  return {
    ok: true,
    viewerRole,
    notes: {
      healthNote: blankToNull(row.care_health_note),
      dietNote: blankToNull(row.care_diet_note),
      supportNote: blankToNull(row.care_support_note),
      updatedAt: row.care_updated_at ?? null,
      updatedByName,
    },
  };
}
