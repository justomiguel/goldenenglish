import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { assertTeacher } from "@/lib/dashboard/assertTeacher";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";
import { canEditAcademicProfileValue } from "@/lib/academic-profile/academicProfileSectionAccess";

export type AcademicProfileStaffSession = {
  supabase: SupabaseClient;
  userId: string;
  isAdmin: boolean;
};

export async function openAcademicProfileStaffSession(): Promise<AcademicProfileStaffSession | null> {
  try {
    const admin = await assertAdmin();
    return { supabase: admin.supabase, userId: admin.user.id, isAdmin: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message !== ADMIN_SESSION_UNAUTHORIZED && message !== ADMIN_SESSION_FORBIDDEN) throw error;
    logServerAuthzDenied("openAcademicProfileStaffSession", { reason: message });
  }
  try {
    const teacher = await assertTeacher();
    return { supabase: teacher.supabase, userId: teacher.profileId, isAdmin: false };
  } catch (error) {
    logServerAuthzDenied("openAcademicProfileStaffSession", {
      reason: error instanceof Error ? error.message : "teacher",
    });
    return null;
  }
}

export async function staffMayWriteAcademicValue(
  session: AcademicProfileStaffSession,
  input: { studentId: string; sectionId?: string },
): Promise<boolean> {
  if (session.isAdmin) return true;
  if (!input.sectionId) return false;
  const { data: section } = await session.supabase
    .from("academic_sections")
    .select("teacher_id, archived_at")
    .eq("id", input.sectionId)
    .maybeSingle();
  if (!section || section.archived_at) return false;
  const { data: assistant } = await session.supabase
    .from("academic_section_assistants")
    .select("assistant_id")
    .eq("section_id", input.sectionId)
    .eq("assistant_id", session.userId)
    .maybeSingle();
  const { data: enrollment } = await session.supabase
    .from("section_enrollments")
    .select("student_id")
    .eq("section_id", input.sectionId)
    .eq("student_id", input.studentId)
    .maybeSingle();
  return canEditAcademicProfileValue({
    isAdmin: false,
    isLeadOrListedAssistant: section.teacher_id === session.userId || Boolean(assistant),
    studentEnrolledInSection: Boolean(enrollment),
  });
}
