import type { SupabaseClient } from "@supabase/supabase-js";
import { getDefaultSectionMaxStudents } from "@/lib/academics/getDefaultSectionMaxStudents";

export type CommitSectionEnrollmentRpcResult =
  | { ok: true; enrollmentId: string }
  | {
      ok: false;
      code: "SCHEDULE_OVERLAP" | "CAPACITY_EXCEEDED" | "ALREADY_ACTIVE" | "RPC";
    };

export async function commitSectionEnrollmentRpc(
  supabase: SupabaseClient,
  input: {
    studentId: string;
    sectionId: string;
    dropId: string | null;
    dropNext: "dropped" | "transferred";
    allowCapacityOverride: boolean;
  },
): Promise<CommitSectionEnrollmentRpcResult> {
  const defMax = getDefaultSectionMaxStudents();
  const { data, error } = await supabase.rpc("academic_admin_section_enroll_commit", {
    p_student_id: input.studentId,
    p_section_id: input.sectionId,
    p_drop_section_enrollment_id: input.dropId,
    p_drop_next_status: input.dropNext,
    p_allow_capacity_override: input.allowCapacityOverride,
    p_default_max_students: defMax,
  });
  if (error) {
    const m = error.message ?? "";
    if (m.includes("ACADEMIC_SCHEDULE_OVERLAP")) return { ok: false as const, code: "SCHEDULE_OVERLAP" };
    if (m.includes("ACADEMIC_CAPACITY_EXCEEDED")) return { ok: false as const, code: "CAPACITY_EXCEEDED" };
    if (m.includes("ACADEMIC_ALREADY_ACTIVE_IN_SECTION"))
      return { ok: false as const, code: "ALREADY_ACTIVE" };
    return { ok: false as const, code: "RPC" };
  }
  const row = data as { enrollment_id?: string } | null;
  const enrollmentId = row?.enrollment_id;
  if (!enrollmentId) return { ok: false as const, code: "RPC" };
  return { ok: true as const, enrollmentId };
}
