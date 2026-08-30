import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { resolveRegistrationFamilyEmail } from "@/lib/register/resolveRegistrationFamilyEmail";
import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";
import { buildRegistrationPayBlock } from "@/lib/register/buildRegistrationPayBlock";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { absoluteUrl } from "@/lib/site/publicUrl";
import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import {
  snapshotCurrencyFromUnknown,
  snapshotTotalFromUnknown,
} from "@/lib/register/registrationIntake";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import type { Locale } from "@/types/i18n";

export type IntakeLeadRow = {
  id: string;
  status: string;
  intake_state: string | null;
  fee_snapshot: unknown;
  fee_captured?: boolean | null;
  enrollment_fee_receipt_path?: string | null;
  email?: string | null;
  tutor_email: string | null;
  first_name: string;
  last_name: string;
  pay_token: string | null;
  preferred_section_id: string | null;
  additional_section_ids?: string[] | null;
  birth_date?: string | null;
};

export async function requireRegistrationIntakeAdmin(): Promise<
  { ok: true; session: SupabaseClient; userId: string } | { ok: false; code: "forbidden" }
> {
  try {
    const { supabase, user } = await assertAdmin();
    return { ok: true, session: supabase, userId: user.id };
  } catch {
    logServerAuthzDenied("registrationIntakeActions");
    return { ok: false, code: "forbidden" };
  }
}

export async function loadRegistrationIntakeLead(
  admin: SupabaseClient,
  id: string,
): Promise<IntakeLeadRow | null> {
  const { data, error } = await admin
    .from("registrations")
    .select(
      "id,status,intake_state,fee_snapshot,fee_captured,enrollment_fee_receipt_path,email,tutor_email,first_name,last_name,pay_token,preferred_section_id,additional_section_ids,birth_date",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("registrationIntakeActions:lead", error, { id });
    return null;
  }
  return (data as IntakeLeadRow | null) ?? null;
}

export function revalidateRegistrationInbox(locale: string) {
  revalidatePath(`/${locale}/dashboard/admin/registrations`, "page");
  revalidatePath(`/${locale}/dashboard/admin`, "page");
  revalidateAcademicSurfaces(locale);
}

export async function emailRegistrationReceiptRejected(
  locale: string,
  lead: IntakeLeadRow,
): Promise<void> {
  const dict = await getDictionary(locale);
  const domain = getRegistrationMailTenantDomain();
  const studentEmail = String(lead.email ?? "").trim().toLowerCase();
  const synthetic = Boolean(domain && studentEmail.endsWith(`@${domain.toLowerCase()}`));
  const birth = lead.birth_date != null ? String(lead.birth_date).slice(0, 10) : "";
  const isMinor =
    /^\d{4}-\d{2}-\d{2}$/.test(birth) &&
    fullYearsFromIsoDate(birth) < getLegalAgeMajorityFromSystem();
  const familyEmail = resolveRegistrationFamilyEmail({
    isMinor,
    tutorEmail: lead.tutor_email,
    studentEmail,
    studentEmailIsSynthetic: synthetic,
  });
  if (!familyEmail || !lead.pay_token) return;
  const origin = absoluteUrl(`/${locale}/matricula/${lead.pay_token}`);
  const total = snapshotTotalFromUnknown(lead.fee_snapshot);
  const currency = snapshotCurrencyFromUnknown(lead.fee_snapshot);
  const amountLabel = total > 0 ? formatMoneyLabel(total, currency, locale) : "";
  const studentName = `${lead.first_name} ${lead.last_name}`.trim();
  await sendBrandedEmail({
    to: familyEmail,
    templateKey: "registration.receipt_rejected",
    locale: locale as Locale,
    vars: {
      greetingName: lead.first_name,
      studentName,
      sectionName: dict.register.enrollmentPayUndecidedSection,
      scheduleLabel: dict.register.enrollmentPayUndecidedSection,
      amountLabel,
      payBlock: buildRegistrationPayBlock({
        payUrl: origin ? origin.toString() : "",
        amountLabel,
        ctaLabel: dict.register.enrollmentPayCta,
        noFeeNote: "",
      }),
    },
  });
}

export function createRegistrationIntakeAdmin() {
  return createAdminClient();
}
