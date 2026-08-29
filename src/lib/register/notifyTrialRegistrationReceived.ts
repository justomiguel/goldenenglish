import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";
import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import { notifyRegistrationReceived } from "@/lib/email/registrationIntakeEmails";
import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";
import { resolveRegistrationFamilyEmail } from "@/lib/register/resolveRegistrationFamilyEmail";
import { absoluteUrl } from "@/lib/site/publicUrl";

export async function notifyTrialRegistrationReceived(input: {
  locale: string;
  dict: Dictionary;
  isMinor: boolean;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
  tutorName: string | null;
  tutorEmail: string | null;
  sectionLabel: string;
  payToken: string;
  snapshotTotal: number;
  snapshotCurrency: string;
}): Promise<void> {
  const locale = input.locale as Locale;
  const domain = getRegistrationMailTenantDomain();
  const studentEmail = input.studentEmail.trim().toLowerCase();
  const synthetic = Boolean(domain && studentEmail.endsWith(`@${domain.toLowerCase()}`));
  const familyEmail = resolveRegistrationFamilyEmail({
    isMinor: input.isMinor,
    tutorEmail: input.tutorEmail,
    studentEmail,
    studentEmailIsSynthetic: synthetic,
  });
  const origin = absoluteUrl(`/${locale}/clase-prueba/${input.payToken}`);
  const payUrl = input.snapshotTotal > 0 && origin ? origin.toString() : "";
  const studentName = `${input.studentFirstName} ${input.studentLastName}`.trim();
  const amountLabel =
    input.snapshotTotal > 0
      ? formatMoneyLabel(input.snapshotTotal, input.snapshotCurrency, locale)
      : "";
  await notifyRegistrationReceived({
    locale,
    familyEmail,
    greetingName: (input.tutorName ?? input.studentFirstName).trim() || studentName,
    studentName,
    sectionName: input.sectionLabel,
    scheduleLabel: input.sectionLabel,
    amountLabel,
    payUrl,
    payCta: input.dict.register.trial.payCta,
    noFeeNote: input.dict.register.trial.noFeeNote,
    adminVars: {
      studentName,
      studentDni: "—",
      studentBirth: "—",
      tutorBlock: input.tutorName
        ? `<p style="margin:0 0 8px;">Tutor: ${input.tutorName}</p>`
        : "",
      sectionName: input.sectionLabel,
      scheduleLabel: input.sectionLabel,
      amountLabel: amountLabel || "—",
      feeModeLabel: "trial",
      sourceLabel: "/register?intent=trial",
      existingStudentLabel: "—",
      adminUrl: absoluteUrl(`/${locale}/dashboard/admin/registrations`)?.toString() ?? "",
    },
  });
}
