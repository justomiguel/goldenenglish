import { createAdminClient } from "@/lib/supabase/admin";
import { logServerException } from "@/lib/logging/serverActionLog";

/**
 * Emails to notify for student billing: the student account and linked tutors
 * (same policy as other billing family emails).
 */
export async function collectRecipientEmailsForStudent(
  studentId: string,
): Promise<string[]> {
  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    logServerException("collectRecipientEmailsForStudent:createAdminClient", err);
    return [];
  }
  const emails = new Set<string>();

  const { data: studentUser } = await admin.auth.admin.getUserById(studentId);
  if (studentUser.user?.email) emails.add(studentUser.user.email);

  const { data: links } = await admin
    .from("tutor_student_rel")
    .select("tutor_id")
    .eq("student_id", studentId);

  for (const row of links ?? []) {
    const pid = row.tutor_id as string;
    const { data: pu } = await admin.auth.admin.getUserById(pid);
    if (pu.user?.email) emails.add(pu.user.email);
  }

  return [...emails];
}
