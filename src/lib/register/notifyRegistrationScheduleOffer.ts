import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { buildRegistrationPayBlock } from "@/lib/register/buildRegistrationPayBlock";
import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";
import { resolveRegistrationFamilyEmail } from "@/lib/register/resolveRegistrationFamilyEmail";
import type { IntakeLeadRow } from "@/lib/register/registrationIntakeActionSupport";
import { absoluteUrl } from "@/lib/site/publicUrl";
import { buildMatriculaPayPath } from "@/lib/site/publicSharePaths";
import type { Dictionary, Locale } from "@/types/i18n";

export async function notifyRegistrationScheduleOffer(input: {
  locale: string;
  dict: Dictionary;
  lead: Pick<
    IntakeLeadRow,
    "first_name" | "last_name" | "email" | "tutor_email" | "birth_date" | "pay_token"
  >;
  originalSectionName: string;
  proposedSectionName: string;
  proposedScheduleLabel: string;
}): Promise<void> {
  const domain = getRegistrationMailTenantDomain();
  const studentEmail = String(input.lead.email ?? "").trim().toLowerCase();
  const synthetic = Boolean(domain && studentEmail.endsWith(`@${domain.toLowerCase()}`));
  const birth = input.lead.birth_date != null ? String(input.lead.birth_date).slice(0, 10) : "";
  const isMinor =
    /^\d{4}-\d{2}-\d{2}$/.test(birth) &&
    fullYearsFromIsoDate(birth) < getLegalAgeMajorityFromSystem();
  const familyEmail = resolveRegistrationFamilyEmail({
    isMinor,
    tutorEmail: input.lead.tutor_email,
    studentEmail,
    studentEmailIsSynthetic: synthetic,
  });
  if (!familyEmail || !input.lead.pay_token) return;
  const origin = absoluteUrl(buildMatriculaPayPath(input.locale, "", input.lead.pay_token));
  const studentName = `${input.lead.first_name} ${input.lead.last_name}`.trim();
  try {
    await sendBrandedEmail({
      to: familyEmail,
      templateKey: "registration.schedule_offer",
      locale: input.locale as Locale,
      vars: {
        greetingName: input.lead.first_name,
        studentName,
        sectionName: input.originalSectionName,
        scheduleLabel: input.proposedScheduleLabel,
        amountLabel: "",
        proposedSectionName: input.proposedSectionName,
        payBlock: buildRegistrationPayBlock({
          payUrl: origin ? origin.toString() : "",
          amountLabel: "",
          ctaLabel: input.dict.register.enrollmentPayCtaOffer,
          noFeeNote: "",
        }),
      },
    });
  } catch {
    /* Mail must not throw after a successful propose write. */
  }
}
