import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

type EnrollmentRow = { id?: unknown; section_id?: unknown; academic_sections?: unknown };

function cohortOf(value: unknown): string {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return "";
  const cohortId = (row as { cohort_id?: unknown }).cohort_id;
  return typeof cohortId === "string" ? cohortId : "";
}

export async function loadRegistrationSectionMoveContext(
  supabase: SupabaseClient,
  input: { registrationId: string; sectionId: string; cohortId: string },
): Promise<
  | { ok: false; code: string }
  | { ok: true; studentId: string; fromEnrollmentIds: string[] }
> {
  const { data, error } = await supabase
    .from("registrations")
    .select("id,status,accepted_student_id")
    .eq("id", input.registrationId)
    .maybeSingle();
  if (error || !data) {
    if (error) logSupabaseClientError("moveRegistrationSection", error, { registrationId: input.registrationId });
    return { ok: false, code: "not_found" };
  }
  const lead = data as { status?: unknown; accepted_student_id?: unknown };
  const studentId = typeof lead.accepted_student_id === "string" ? lead.accepted_student_id : "";
  if (lead.status !== "enrolled" || !studentId) return { ok: false, code: "not_found" };

  const section = await supabase
    .from("academic_sections")
    .select("id,cohort_id")
    .eq("id", input.sectionId)
    .maybeSingle();
  if (section.error || !section.data) {
    if (section.error) logSupabaseClientError("moveRegistrationSection", section.error, { sectionId: input.sectionId });
    return { ok: false, code: "section_move_outside_cohort" };
  }
  if (String((section.data as { cohort_id?: unknown }).cohort_id ?? "") !== input.cohortId) {
    return { ok: false, code: "section_move_outside_cohort" };
  }

  const active = await supabase
    .from("section_enrollments")
    .select("id,section_id,academic_sections(cohort_id)")
    .eq("student_id", studentId)
    .eq("status", "active");
  if (active.error) {
    logSupabaseClientError("moveRegistrationSection", active.error, { studentId });
    return { ok: false, code: "save_failed" };
  }
  const inCohort = ((active.data ?? []) as EnrollmentRow[]).filter(
    (row) => cohortOf(row.academic_sections) === input.cohortId,
  );
  if (inCohort.some((row) => String(row.section_id ?? "") === input.sectionId)) {
    return { ok: false, code: "section_move_same" };
  }
  return {
    ok: true,
    studentId,
    fromEnrollmentIds: inCohort.map((row) => String(row.id ?? "")).filter(Boolean),
  };
}
