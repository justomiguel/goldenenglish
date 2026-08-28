import { collectFamilyMailboxesForStudent } from "@/lib/email/collectFamilyMailboxesForStudent";
import { resolveAdminStudentWelcomeInvite } from "@/lib/email/resolveAdminStudentWelcomeInvite";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";

function asLocale(value: string): Locale {
  if (value === "en" || value === "pt") return value;
  return "es";
}

/**
 * After an admin creates a student: welcome + portal + change-password.
 * Minors: tutor only. Adults: the student when their mailbox is real.
 * Never includes a raw password. Failures are logged; they do not throw.
 */
export async function notifyAdminCreatedStudentWelcome(input: {
  studentId: string;
  locale: string;
  studentFirstName: string;
  studentLastName: string;
  /** When known at create time (minor guardian flow), wins over the profile flag. */
  isMinor?: boolean;
  studentEmailHint?: string | null;
  tutorEmailHints?: Array<string | null | undefined>;
}): Promise<void> {
  try {
    const boxes = await collectFamilyMailboxesForStudent(input.studentId);
    const invite = resolveAdminStudentWelcomeInvite({
      isMinor: input.isMinor ?? boxes.isMinor,
      studentEmail: boxes.studentEmail ?? input.studentEmailHint ?? null,
      tutorEmails: [...boxes.tutorEmails, ...(input.tutorEmailHints ?? [])],
    });
    if (!invite) return;

    const locale = asLocale(input.locale);
    const studentName = `${input.studentFirstName} ${input.studentLastName}`.replace(/\s+/g, " ").trim();
    const greetingName = input.studentFirstName.trim() || studentName;
    const origin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";
    const portalUrl = `${origin}/${locale}/login`;
    const templateKey =
      invite.audience === "tutor"
        ? "notifications.admin_tutor_welcome"
        : "notifications.admin_student_welcome";

    for (const to of invite.emails) {
      const r = await sendBrandedEmail({
        to,
        templateKey,
        locale,
        vars: { greetingName, studentName, portalUrl },
      });
      if (!r.ok) {
        logServerException("notifyAdminCreatedStudentWelcome:send", new Error(r.error), {
          studentId: input.studentId,
        });
      }
    }
  } catch (err) {
    logServerException("notifyAdminCreatedStudentWelcome", err, { studentId: input.studentId });
  }
}
