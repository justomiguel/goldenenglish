import type { Dictionary, Locale } from "@/types/i18n";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { buildRegistrationPayBlock } from "@/lib/register/buildRegistrationPayBlock";
import { familyEmailForTrialLead } from "@/lib/register/notifyTrialSeatMails";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { absoluteUrl } from "@/lib/site/publicUrl";
import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import { logServerException } from "@/lib/logging/serverActionLog";

export async function notifyTrialRescheduled(input: {
  locale: string;
  dict: Dictionary;
  lead: {
    firstName: string;
    lastName: string;
    email: string | null;
    tutorName: string | null;
    tutorEmail: string | null;
    birthDate: string | null;
  };
  sectionLabel: string;
  payToken: string;
  deltaAmount: number;
  currency: string;
}): Promise<void> {
  const locale: Locale = input.locale === "en" || input.locale === "pt" ? input.locale : "es";
  const isMinor = input.lead.birthDate
    ? fullYearsFromIsoDate(input.lead.birthDate) < getLegalAgeMajorityFromSystem()
    : false;
  const to = familyEmailForTrialLead({
    isMinor,
    studentEmail: input.lead.email,
    tutorEmail: input.lead.tutorEmail,
  });
  if (!to) return;
  const studentName = `${input.lead.firstName} ${input.lead.lastName}`.trim();
  const payUrl =
    input.deltaAmount > 0 && input.payToken
      ? absoluteUrl(`/${locale}/clase-prueba/${input.payToken}`)?.toString() ?? ""
      : "";
  const sent = await sendBrandedEmail({
    to,
    templateKey: "registration.trial_rescheduled",
    locale,
    vars: {
      greetingName: (input.lead.tutorName ?? input.lead.firstName).trim() || studentName,
      studentName,
      sectionName: input.sectionLabel,
      scheduleLabel: input.sectionLabel,
      payBlock: buildRegistrationPayBlock({
        payUrl,
        amountLabel:
          input.deltaAmount > 0
            ? formatMoneyLabel(input.deltaAmount, input.currency, locale)
            : "",
        ctaLabel: input.dict.register.trial.payCta,
        noFeeNote: input.dict.register.trial.noFeeNote,
      }),
    },
  });
  if (!sent.ok) logServerException("notifyTrialRescheduled", new Error(sent.error));
}
