import { getBrandPublic } from "@/lib/brand/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logServerException } from "@/lib/logging/serverActionLog";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import type { Locale } from "@/types/i18n";

async function emailsForStudentParents(studentId: string): Promise<string[]> {
  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    logServerException("emailsForStudentParents:createAdminClient", err);
    return [];
  }
  const out = new Set<string>();
  const { data: su } = await admin.auth.admin.getUserById(studentId);
  if (su.user?.email) out.add(su.user.email);
  const { data: links } = await admin
    .from("tutor_student_rel")
    .select("tutor_id")
    .eq("student_id", studentId);
  for (const row of links ?? []) {
    const { data: pu } = await admin.auth.admin.getUserById(row.tutor_id as string);
    if (pu.user?.email) out.add(pu.user.email);
  }
  return [...out];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendStudentChurnAlert(params: {
  studentId: string;
  locale: Locale;
  studentDisplayName: string;
}): Promise<void> {
  const toList = await emailsForStudentParents(params.studentId);
  if (toList.length === 0) return;
  const brand = getBrandPublic();
  const dict = await getDictionary(params.locale);
  const c = dict.emailChurn;
  const display = params.studentDisplayName.trim() || c.anonymousDisplayName;
  for (const to of toList) {
    await sendBrandedEmail({
      to,
      templateKey: "churn.inactivity",
      locale: params.locale,
      vars: {
        greeting: escapeHtml(c.greeting),
        studentDisplayName: escapeHtml(display),
        contactEmail: escapeHtml(brand.contactEmail),
      },
    });
  }
}
