import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { MessagingRecipient } from "@/types/messaging";

export async function loadLinkedStudentIdsForParent(
  supabase: SupabaseClient,
  parentId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", parentId);
  if (error) {
    logSupabaseClientError("loadLinkedStudentIdsForParent", error, { parentId });
    return [];
  }
  return [...new Set((data ?? []).map((r) => r.student_id as string))];
}

/**
 * For each linked student: prefer `profiles.assigned_teacher_id`, else lead teacher
 * of an active non-archived section enrollment.
 */
export async function loadTeacherIdByStudentId(
  supabase: SupabaseClient,
  studentIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (studentIds.length === 0) return out;

  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, assigned_teacher_id")
    .in("id", studentIds);
  if (profErr) {
    logSupabaseClientError("loadTeacherIdByStudentId:profiles", profErr, {
      studentCount: studentIds.length,
    });
  } else {
    for (const p of profiles ?? []) {
      const tid = p.assigned_teacher_id as string | null;
      if (tid) out.set(p.id as string, tid);
    }
  }

  const needsSection = studentIds.filter((id) => !out.has(id));
  if (needsSection.length === 0) return out;

  const { data: enrollments, error: enrErr } = await supabase
    .from("section_enrollments")
    .select("student_id, section_id, created_at")
    .in("student_id", needsSection)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (enrErr) {
    logSupabaseClientError("loadTeacherIdByStudentId:section_enrollments", enrErr, {
      studentCount: needsSection.length,
    });
    return out;
  }

  const sectionByStudent = new Map<string, string>();
  for (const row of enrollments ?? []) {
    const studentId = row.student_id as string;
    if (!sectionByStudent.has(studentId)) {
      sectionByStudent.set(studentId, row.section_id as string);
    }
  }

  const sectionIds = [...new Set(sectionByStudent.values())];
  if (sectionIds.length === 0) return out;

  const { data: sections, error: secErr } = await supabase
    .from("academic_sections")
    .select("id, teacher_id")
    .in("id", sectionIds)
    .is("archived_at", null);
  if (secErr) {
    logSupabaseClientError("loadTeacherIdByStudentId:academic_sections", secErr, {
      sectionCount: sectionIds.length,
    });
    return out;
  }

  const teacherBySection = new Map<string, string>();
  for (const sec of sections ?? []) {
    const tid = sec.teacher_id as string | null;
    if (tid) teacherBySection.set(sec.id as string, tid);
  }

  for (const [studentId, sectionId] of sectionByStudent) {
    const tid = teacherBySection.get(sectionId);
    if (tid) out.set(studentId, tid);
  }

  return out;
}

export async function loadParentLinkedTeacherIds(
  supabase: SupabaseClient,
  parentId: string,
): Promise<string[]> {
  const studentIds = await loadLinkedStudentIdsForParent(supabase, parentId);
  const byStudent = await loadTeacherIdByStudentId(supabase, studentIds);
  return [...new Set(byStudent.values())];
}

export async function parentCanMessageTeacher(
  supabase: SupabaseClient,
  parentId: string,
  teacherId: string,
): Promise<boolean> {
  const allowed = await loadParentLinkedTeacherIds(supabase, parentId);
  return allowed.includes(teacherId);
}

export async function loadParentMessageTeacherRecipients(
  supabase: SupabaseClient,
  parentId: string,
): Promise<MessagingRecipient[]> {
  const teacherIds = await loadParentLinkedTeacherIds(supabase, parentId);
  if (teacherIds.length === 0) return [];

  const { data: teachers, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .in("id", teacherIds)
    .eq("role", "teacher")
    .order("last_name", { ascending: true });

  if (error) {
    logSupabaseClientError("loadParentMessageTeacherRecipients", error, { parentId });
    return [];
  }

  return (teachers ?? []).map((t) => ({
    id: t.id as string,
    first_name: t.first_name as string,
    last_name: t.last_name as string,
    role: "teacher",
  }));
}
