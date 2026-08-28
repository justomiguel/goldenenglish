import { createAdminClient } from "@/lib/supabase/admin";
import { logServerException } from "@/lib/logging/serverActionLog";

export type FamilyMailboxesForStudent = {
  isMinor: boolean;
  studentEmail: string | null;
  tutorEmails: string[];
};

/**
 * Auth mailboxes for the student and linked tutors, plus `profiles.is_minor`.
 * Deliverability is applied later by `resolveAdminStudentWelcomeInvite`.
 */
export async function collectFamilyMailboxesForStudent(
  studentId: string,
): Promise<FamilyMailboxesForStudent> {
  const empty: FamilyMailboxesForStudent = {
    isMinor: false,
    studentEmail: null,
    tutorEmails: [],
  };
  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    logServerException("collectFamilyMailboxesForStudent:createAdminClient", err);
    return empty;
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("is_minor")
    .eq("id", studentId)
    .maybeSingle();

  const { data: studentUser } = await admin.auth.admin.getUserById(studentId);
  const tutorEmails: string[] = [];
  const { data: links } = await admin
    .from("tutor_student_rel")
    .select("tutor_id")
    .eq("student_id", studentId);

  for (const row of links ?? []) {
    const pid = row.tutor_id as string;
    const { data: pu } = await admin.auth.admin.getUserById(pid);
    if (pu.user?.email) tutorEmails.push(pu.user.email);
  }

  return {
    isMinor: profile?.is_minor === true,
    studentEmail: studentUser.user?.email ?? null,
    tutorEmails,
  };
}
