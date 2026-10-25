import type { SupabaseClient } from "@supabase/supabase-js";
import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import { notifyRegistrationReceived } from "@/lib/email/registrationIntakeEmails";
import {
  formatJoinPackageBreakdown,
  resolveJoinPackagePayCta,
} from "@/lib/register/formatJoinPackageCopy";
import { parseJoinPackageSnapshot } from "@/lib/register/parseJoinPackageSnapshot";
import { buildRegistrationEnrollmentFeeInsertFields } from "@/lib/register/buildRegistrationEnrollmentFeeInsertFields";
import { requestedSectionsHaveOpenSeats } from "@/lib/register/requestedSectionsHaveOpenSeats";
import { resolveRegistrationFamilyEmail } from "@/lib/register/resolveRegistrationFamilyEmail";
import { getRequestMailTenantDomain } from "@/lib/register/requestMailTenant";
import { absoluteUrlForRequest } from "@/lib/site/requestPublicUrl";
import { buildMatriculaPayPath } from "@/lib/site/publicSharePaths";
import type { Locale } from "@/types/i18n";
import type { Dictionary } from "@/types/i18n";

type RpcClient = {
  rpc: (
    fn: string,
    args: { p_section_id: string },
  ) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
};

export async function quotePublicRegistrationFee(input: {
  supabase: RpcClient;
  admin: SupabaseClient;
  sectionIds: string[];
  nowIso: string;
  dni?: string | null;
}): Promise<
  | { ok: false; reason: "section_full" }
  | { ok: true; fields: Awaited<ReturnType<typeof buildRegistrationEnrollmentFeeInsertFields>> }
> {
  const open = await requestedSectionsHaveOpenSeats(input.supabase, input.sectionIds);
  if (!open) return { ok: false, reason: "section_full" };
  const fields = await buildRegistrationEnrollmentFeeInsertFields({
    admin: input.admin,
    sectionIds: input.sectionIds,
    nowIso: input.nowIso,
    dni: input.dni,
  });
  return { ok: true, fields };
}

export async function notifyPublicRegistrationReceived(input: {
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
}): Promise<void> {
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
  const origin = await absoluteUrlForRequest(buildMatriculaPayPath(locale, input.sectionLabel ?? "", input.payToken));
  const payUrl = input.snapshotTotal > 0 && origin ? origin.toString() : "";
  const studentName = `${input.studentFirstName} ${input.studentLastName}`.trim();
  const sectionName =
    input.sectionLabel?.trim() || input.dict.register.enrollmentPayUndecidedSection;
  const parsed = parseJoinPackageSnapshot(input.feeSnapshot);
  const breakdown = formatJoinPackageBreakdown(parsed, locale, {
    enrollment: input.dict.admin.registrations.intake.enrollmentKind,
  });
  const money =
    input.snapshotTotal > 0
      ? formatMoneyLabel(input.snapshotTotal, input.snapshotCurrency, locale)
      : "";
  const amountLabel = [breakdown, money].filter(Boolean).join(" ");
  await notifyRegistrationReceived({
    locale,
    familyEmail,
    greetingName: (input.tutorName ?? input.studentFirstName).trim() || studentName,
    studentName,
    sectionName,
    scheduleLabel: sectionName,
    amountLabel,
    payUrl,
    payCta: resolveJoinPackagePayCta(parsed, locale, {
      both: input.dict.register.enrollmentPayCta,
      month: input.dict.register.enrollmentPayCtaMonth,
      enrollment: input.dict.register.enrollmentPayCtaEnrollment,
    }),
    noFeeNote: input.dict.register.enrollmentPayNoFee,
    adminVars: {
      studentName,
      studentDni: "—",
      studentBirth: "—",
      tutorBlock: input.tutorName
        ? `<p style="margin:0 0 8px;">Tutor: ${input.tutorName}</p>`
        : "",
      sectionName,
      scheduleLabel: sectionName,
      amountLabel: amountLabel || "—",
      feeModeLabel: "—",
      sourceLabel: "/register",
      existingStudentLabel: "—",
      adminUrl: (await absoluteUrlForRequest(`/${locale}/dashboard/admin/registrations`))?.toString() ?? "",
    },
  });
}
