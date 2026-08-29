import type { Dictionary, Locale } from "@/types/i18n";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { sendRegistrationAdminEmails } from "@/lib/email/registrationIntakeEmails";
import { buildRegistrationPayBlock } from "@/lib/register/buildRegistrationPayBlock";
import { resolveRegistrationFamilyEmail } from "@/lib/register/resolveRegistrationFamilyEmail";
import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";
import { isDeliverableAuthEmail } from "@/lib/auth/isSyntheticAuthEmail";
import { absoluteUrl } from "@/lib/site/publicUrl";
import { logServerException } from "@/lib/logging/serverActionLog";

export function familyEmailForTrialLead(input: {
  isMinor: boolean;
  studentEmail: string | null;
  tutorEmail: string | null;
}): string | null {
  const studentEmail = (input.studentEmail ?? "").trim().toLowerCase();
  const domain = getRegistrationMailTenantDomain();
  const synthetic = Boolean(domain && studentEmail.endsWith(`@${domain.toLowerCase()}`));
  const email = resolveRegistrationFamilyEmail({
    isMinor: input.isMinor,
    tutorEmail: input.tutorEmail,
    studentEmail,
    studentEmailIsSynthetic: synthetic,
  });
  if (!email || !isDeliverableAuthEmail(email)) return null;
  return email;
}

export async function notifyTrialSeatInvite(input: {
  locale: Locale;
  dict: Dictionary;
  familyEmail: string | null;
  greetingName: string;
  studentName: string;
  sectionName: string;
  scheduleLabel: string;
  convertToken: string;
}): Promise<void> {
  if (!input.familyEmail) return;
  const origin = absoluteUrl(`/${input.locale}/unirse/${input.convertToken}`);
  const payBlock = buildRegistrationPayBlock({
    payUrl: origin?.toString() ?? "",
    amountLabel: "",
    ctaLabel: input.dict.register.trial.inviteCta,
    noFeeNote: "",
  });
  const sent = await sendBrandedEmail({
    to: input.familyEmail,
    templateKey: "registration.trial_invite",
    locale: input.locale,
    vars: {
      greetingName: input.greetingName,
      studentName: input.studentName,
      sectionName: input.sectionName,
      scheduleLabel: input.scheduleLabel,
      payBlock,
    },
  });
  if (!sent.ok) {
    logServerException("notifyTrialSeatInvite", new Error(sent.error));
  }
}

export async function notifyTrialSeatMissed(input: {
  locale: Locale;
  dict: Dictionary;
  familyEmail: string | null;
  greetingName: string;
  studentName: string;
  sectionName: string;
  scheduleLabel: string;
  rescheduleToken: string;
}): Promise<void> {
  if (!input.familyEmail) return;
  const origin = absoluteUrl(
    `/${input.locale}/register?intent=trial&reschedule=${input.rescheduleToken}`,
  );
  const payBlock = buildRegistrationPayBlock({
    payUrl: origin?.toString() ?? "",
    amountLabel: "",
    ctaLabel: input.dict.register.trial.missedCta,
    noFeeNote: input.dict.register.trial.missedNote,
  });
  const sent = await sendBrandedEmail({
    to: input.familyEmail,
    templateKey: "registration.trial_missed",
    locale: input.locale,
    vars: {
      greetingName: input.greetingName,
      studentName: input.studentName,
      sectionName: input.sectionName,
      scheduleLabel: input.scheduleLabel,
      payBlock,
    },
  });
  if (!sent.ok) {
    logServerException("notifyTrialSeatMissed", new Error(sent.error));
  }
}

export async function notifyTrialAdminAttendanceDue(input: {
  locale: Locale;
  studentName: string;
  sectionName: string;
  scheduleLabel: string;
}): Promise<void> {
  const adminUrl =
    absoluteUrl(`/${input.locale}/dashboard/admin/registrations`)?.toString() ?? "";
  await sendRegistrationAdminEmails({
    locale: input.locale,
    templateKey: "registration.admin_trial_attendance_due",
    vars: {
      studentName: input.studentName,
      studentDni: "—",
      studentBirth: "—",
      tutorBlock: "",
      sectionName: input.sectionName,
      scheduleLabel: input.scheduleLabel,
      amountLabel: "—",
      feeModeLabel: "trial",
      sourceLabel: "trial-class-followup",
      existingStudentLabel: "—",
      adminUrl,
    },
  });
}
