import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import { sendRegistrationAdminEmails } from "@/lib/email/registrationIntakeEmails";
import { logServerInfo, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  loadRegistrationPayLeadByToken,
} from "@/lib/register/loadRegistrationPayLeadByToken";
import {
  registrationFeeFamilyClaim,
  withRegistrationFeeCashClaim,
} from "@/lib/register/registrationFeeFamilyClaim";
import { absoluteUrlForRequest } from "@/lib/site/requestPublicUrl";
import type { Locale } from "@/types/i18n";

export type ClaimRegistrationEnrollmentCashResult =
  | { ok: true }
  | { ok: false; code: "not_found" | "enrolled" | "already_captured" | "no_amount" | "update_failed" };

export async function claimRegistrationEnrollmentCashCore(input: {
  admin: SupabaseClient;
  payToken: string;
  locale: string;
  sectionLabel: string;
}): Promise<ClaimRegistrationEnrollmentCashResult> {
  const lead = await loadRegistrationPayLeadByToken(input.admin, input.payToken);
  if (!lead) return { ok: false, code: "not_found" };
  if (lead.status === "enrolled") return { ok: false, code: "enrolled" };
  if (lead.feeCaptured) return { ok: false, code: "already_captured" };
  if (!(lead.snapshotTotal > 0)) return { ok: false, code: "no_amount" };
  if (registrationFeeFamilyClaim(lead.feeSnapshot) === "cash") return { ok: true };

  const { error } = await input.admin
    .from("registrations")
    .update({ fee_snapshot: withRegistrationFeeCashClaim(lead.feeSnapshot) })
    .eq("id", lead.id);
  if (error) {
    logSupabaseClientError("claimRegistrationEnrollmentCash:update", error, {
      registrationId: lead.id,
    });
    return { ok: false, code: "update_failed" };
  }

  revalidatePath(`/${input.locale}/dashboard/admin/registrations`, "page");
  logServerInfo("claimRegistrationEnrollmentCash", {
    registrationId: lead.id,
    code: "cash_claimed",
  });
  await notifyCashClaim({
    lead,
    locale: input.locale as Locale,
    sectionLabel: input.sectionLabel,
  });
  return { ok: true };
}

async function notifyCashClaim(input: {
  lead: NonNullable<Awaited<ReturnType<typeof loadRegistrationPayLeadByToken>>>;
  locale: Locale;
  sectionLabel: string;
}): Promise<void> {
  const studentName = `${input.lead.firstName} ${input.lead.lastName}`.trim();
  const amountLabel = formatMoneyLabel(
    input.lead.snapshotTotal,
    input.lead.snapshotCurrency,
    input.locale,
  );
  await sendRegistrationAdminEmails({
    locale: input.locale,
    templateKey: "registration.admin_cash_claimed",
    vars: {
      studentName,
      studentDni: "—",
      studentBirth: "—",
      tutorBlock: input.lead.tutorName
        ? `<p style="margin:0 0 8px;">Tutor: ${input.lead.tutorName}</p>`
        : "",
      sectionName: input.sectionLabel || "—",
      scheduleLabel: input.sectionLabel || "—",
      amountLabel,
      feeModeLabel: "—",
      sourceLabel: "/matricula",
      existingStudentLabel: "—",
      adminUrl:
        (await absoluteUrlForRequest(`/${input.locale}/dashboard/admin/registrations`))?.toString() ??
        "",
    },
  });
}
