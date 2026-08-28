import type { SupabaseClient } from "@supabase/supabase-js";
import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import { notifyRegistrationReceived } from "@/lib/email/registrationIntakeEmails";
import { buildRegistrationEnrollmentFeeInsertFields } from "@/lib/register/buildRegistrationEnrollmentFeeInsertFields";
import { requestedSectionsHaveOpenSeats } from "@/lib/register/requestedSectionsHaveOpenSeats";
import { resolveRegistrationFamilyEmail } from "@/lib/register/resolveRegistrationFamilyEmail";
import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";
import { absoluteUrl } from "@/lib/site/publicUrl";
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
  const origin = absoluteUrl(`/${locale}/matricula/${input.payToken}`);
  const payUrl = input.snapshotTotal > 0 && origin ? origin.toString() : "";
  const studentName = `${input.studentFirstName} ${input.studentLastName}`.trim();
  const sectionName =
    input.sectionLabel?.trim() || input.dict.register.enrollmentPayUndecidedSection;
  const amountLabel =
    input.snapshotTotal > 0
      ? formatMoneyLabel(input.snapshotTotal, input.snapshotCurrency, locale)
      : "";
  await notifyRegistrationReceived({
    locale,
    familyEmail,
    greetingName: (input.tutorName ?? input.studentFirstName).trim() || studentName,
    studentName,
    sectionName,
    scheduleLabel: sectionName,
    amountLabel,
    payUrl,
    payCta: input.dict.register.enrollmentPayCta,
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
      adminUrl: absoluteUrl(`/${locale}/dashboard/admin/registrations`)?.toString() ?? "",
    },
  });
}
