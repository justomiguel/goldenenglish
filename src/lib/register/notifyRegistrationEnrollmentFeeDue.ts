import "server-only";
import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { logServerException } from "@/lib/logging/serverActionLog";
import { buildRegistrationPayBlock } from "@/lib/register/buildRegistrationPayBlock";
import {
  formatJoinPackageBreakdown,
  resolveJoinPackagePayCta,
} from "@/lib/register/formatJoinPackageCopy";
import { parseJoinPackageSnapshot } from "@/lib/register/parseJoinPackageSnapshot";
import { getRequestMailTenantDomain } from "@/lib/register/requestMailTenant";
import { resolveRegistrationFamilyEmail } from "@/lib/register/resolveRegistrationFamilyEmail";
import { absoluteUrlForRequest } from "@/lib/site/requestPublicUrl";
import { buildMatriculaPayPath } from "@/lib/site/publicSharePaths";
import type { Dictionary, Locale } from "@/types/i18n";

export async function notifyRegistrationEnrollmentFeeDue(input: {
  locale: string;
  dict: Dictionary;
  isMinor: boolean;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
  tutorName: string | null;
  tutorEmail: string | null;
  sectionLabel: string | null;
  payToken: string;
  snapshotTotal: number;
  snapshotCurrency: string;
  feeSnapshot?: unknown;
}): Promise<{ ok: true } | { ok: false; code: "no_family_email" | "pay_link_missing" | "mail_failed" }> {
  const locale = input.locale as Locale;
  const domain = await getRequestMailTenantDomain();
  const studentEmail = input.studentEmail.trim().toLowerCase();
  const synthetic = Boolean(domain && studentEmail.endsWith(`@${domain.toLowerCase()}`));
  const familyEmail = resolveRegistrationFamilyEmail({
    isMinor: input.isMinor,
    tutorEmail: input.tutorEmail,
    studentEmail,
    studentEmailIsSynthetic: synthetic,
  });
  if (!familyEmail) return { ok: false, code: "no_family_email" };

  const origin = await absoluteUrlForRequest(
    buildMatriculaPayPath(locale, input.sectionLabel ?? "", input.payToken),
  );
  if (!(input.snapshotTotal > 0) || !origin) return { ok: false, code: "pay_link_missing" };

  const studentName = `${input.studentFirstName} ${input.studentLastName}`.trim();
  const sectionName = input.sectionLabel?.trim() || input.dict.register.enrollmentPayUndecidedSection;
  const parsed = parseJoinPackageSnapshot(input.feeSnapshot);
  const breakdown = formatJoinPackageBreakdown(parsed, locale, {
    enrollment: input.dict.admin.registrations.intake.enrollmentKind,
  });
  const money = formatMoneyLabel(input.snapshotTotal, input.snapshotCurrency, locale);
  const amountLabel = [breakdown, money].filter(Boolean).join(" ");
  const payBlock = buildRegistrationPayBlock({
    payUrl: origin.toString(),
    amountLabel,
    ctaLabel: input.dict.register.enrollmentFeePayCta,
    noFeeNote: input.dict.register.enrollmentPayNoFee,
  });
  const sent = await sendBrandedEmail({
    to: familyEmail,
    templateKey: "registration.enrollment_fee_due",
    locale,
    vars: {
      greetingName: (input.tutorName ?? input.studentFirstName).trim() || studentName,
      studentName,
      sectionName,
      scheduleLabel: sectionName,
      amountLabel,
      payBlock,
    },
  });
  if (!sent.ok) {
    await logServerException("notifyRegistrationEnrollmentFeeDue", new Error(sent.error), {
      code: "mail_failed",
    });
    return { ok: false, code: "mail_failed" };
  }
  if ("skipped" in sent && sent.skipped) return { ok: false, code: "mail_failed" };
  return { ok: true };
}
