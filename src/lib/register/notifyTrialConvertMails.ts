import type { Dictionary, Locale } from "@/types/i18n";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { sendRegistrationAdminEmails } from "@/lib/email/registrationIntakeEmails";
import { notifyRegistrationWelcome } from "@/lib/email/registrationIntakeEmails";
import { familyEmailForTrialLead } from "@/lib/register/notifyTrialSeatMails";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { absoluteUrl } from "@/lib/site/publicUrl";
import { logServerException } from "@/lib/logging/serverActionLog";

export async function notifyTrialConvertMails(input: {
  locale: string;
  dict: Dictionary;
  reuseStudent: boolean;
  isMinor: boolean;
  studentName: string;
  studentFirstName: string;
  studentEmail: string | null;
  tutorName: string | null;
  tutorEmail: string | null;
  birthDate?: string | null;
  sectionLabel: string;
}): Promise<void> {
  const locale: Locale = input.locale === "en" || input.locale === "pt" ? input.locale : "es";
  const isMinor =
    input.birthDate && input.birthDate.length === 10
      ? fullYearsFromIsoDate(input.birthDate) < getLegalAgeMajorityFromSystem()
      : input.isMinor;
  if (input.reuseStudent) {
    const to = familyEmailForTrialLead({
      isMinor,
      studentEmail: input.studentEmail,
      tutorEmail: input.tutorEmail,
    });
    if (to) {
      const sent = await sendBrandedEmail({
        to,
        templateKey: "registration.trial_added",
        locale,
        vars: {
          greetingName: (input.tutorName ?? input.studentFirstName).trim() || input.studentName,
          studentName: input.studentName,
          sectionName: input.sectionLabel,
          scheduleLabel: input.sectionLabel,
          payBlock: "",
        },
      });
      if (!sent.ok) logServerException("notifyTrialConvertMails:added", new Error(sent.error));
    }
  } else {
    await notifyRegistrationWelcome({
      locale,
      isMinor,
      studentEmail: input.studentEmail,
      tutorEmail: input.tutorEmail,
      greetingName: isMinor
        ? (input.tutorName ?? "").trim() || input.studentName
        : input.studentFirstName,
      studentName: input.studentName,
      sectionName: input.sectionLabel,
      scheduleLabel: input.sectionLabel,
    });
  }
  await sendRegistrationAdminEmails({
    locale,
    templateKey: "registration.admin_trial_enrolled",
    vars: {
      studentName: input.studentName,
      studentDni: "—",
      studentBirth: "—",
      tutorBlock: input.tutorName ? `<p>Tutor: ${input.tutorName}</p>` : "",
      sectionName: input.sectionLabel,
      scheduleLabel: input.sectionLabel,
      amountLabel: "—",
      feeModeLabel: "trial",
      sourceLabel: "clase de prueba",
      existingStudentLabel: input.reuseStudent ? "Sí" : "No",
      adminUrl: absoluteUrl(`/${locale}/dashboard/admin/registrations`)?.toString() ?? "",
    },
  });
}
