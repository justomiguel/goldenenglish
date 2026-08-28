"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { acceptRegistrationLead } from "@/lib/register/acceptRegistrationLead";
import { parseRegistrationWaiveReason } from "@/lib/register/parseRegistrationWaiveReason";
import { requestedSectionsHaveOpenSeats } from "@/lib/register/requestedSectionsHaveOpenSeats";
import { buildRegistrationEnrollmentFeeInsertFields } from "@/lib/register/buildRegistrationEnrollmentFeeInsertFields";
import { receiptSignedUrlForAdmin } from "@/lib/payments/receiptSignedUrl";
import { parseRegistrationIntakeState } from "@/lib/register/registrationIntake";
import {
  emailRegistrationReceiptRejected,
  loadRegistrationIntakeLead,
  requireRegistrationIntakeAdmin,
  revalidateRegistrationInbox,
} from "@/lib/register/registrationIntakeActionSupport";
import { startAdminRegistrationEnrollmentFeeFlow } from "@/lib/register/startAdminRegistrationEnrollmentFeeFlow";

export type IntakeActionResult = { ok: true } | { ok: false; code: string };

export async function waiveRegistrationFeeAction(input: {
  locale: string;
  registrationId: string;
  reason: string;
}): Promise<IntakeActionResult> {
  const reason = parseRegistrationWaiveReason(input.reason);
  if (!reason) return { ok: false, code: "reason_required" };
  const auth = await requireRegistrationIntakeAdmin();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const lead = await loadRegistrationIntakeLead(admin, input.registrationId);
  if (!lead) return { ok: false, code: "not_found" };
  const dict = await getDictionary(input.locale);
  const result = await acceptRegistrationLead({
    admin,
    enrollClient: auth.session,
    locale: input.locale,
    dict,
    registrationId: input.registrationId,
    waiveReason: reason,
  });
  if (!result.ok) return { ok: false, code: "accept_failed" };
  revalidateRegistrationInbox(input.locale);
  return { ok: true };
}

export async function approveRegistrationReceiptAction(input: {
  locale: string;
  registrationId: string;
}): Promise<IntakeActionResult> {
  const auth = await requireRegistrationIntakeAdmin();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const lead = await loadRegistrationIntakeLead(admin, input.registrationId);
  if (!lead || parseRegistrationIntakeState(lead.intake_state) !== "receipt_pending") {
    return { ok: false, code: "not_found" };
  }
  const dict = await getDictionary(input.locale);
  const result = await acceptRegistrationLead({
    admin,
    enrollClient: auth.session,
    locale: input.locale,
    dict,
    registrationId: input.registrationId,
    paidCapture: true,
  });
  if (!result.ok) return { ok: false, code: "accept_failed" };
  void recordSystemAudit({
    action: "registration_receipt_approved",
    resourceType: "registration",
    resourceId: input.registrationId,
    payload: { student_id: result.studentId },
  });
  revalidateRegistrationInbox(input.locale);
  return { ok: true };
}

export async function rejectRegistrationReceiptAction(input: {
  locale: string;
  registrationId: string;
  note: string;
}): Promise<IntakeActionResult> {
  const auth = await requireRegistrationIntakeAdmin();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const lead = await loadRegistrationIntakeLead(admin, input.registrationId);
  if (!lead) return { ok: false, code: "not_found" };
  const { error } = await admin
    .from("registrations")
    .update({ intake_state: "awaiting_fee" })
    .eq("id", input.registrationId);
  if (error) {
    logSupabaseClientError("rejectRegistrationReceipt:update", error, {
      registrationId: input.registrationId,
    });
    return { ok: false, code: "save_failed" };
  }
  void recordSystemAudit({
    action: "registration_receipt_rejected",
    resourceType: "registration",
    resourceId: input.registrationId,
    payload: { note: input.note.trim().slice(0, 200) },
  });
  await emailRegistrationReceiptRejected(input.locale, lead);
  revalidateRegistrationInbox(input.locale);
  return { ok: true };
}

export async function assignRegistrationSectionAction(input: {
  locale: string;
  registrationId: string;
  sectionId: string;
}): Promise<IntakeActionResult> {
  const auth = await requireRegistrationIntakeAdmin();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const lead = await loadRegistrationIntakeLead(admin, input.registrationId);
  if (!lead) return { ok: false, code: "not_found" };
  const open = await requestedSectionsHaveOpenSeats(admin, [input.sectionId]);
  if (!open) return { ok: false, code: "section_full" };
  const quoted = await buildRegistrationEnrollmentFeeInsertFields({
    admin,
    sectionIds: [input.sectionId],
    nowIso: new Date().toISOString(),
  });
  const additional = (lead.additional_section_ids ?? []).filter((id) => id !== input.sectionId);
  const { error } = await admin
    .from("registrations")
    .update({
      preferred_section_id: input.sectionId,
      additional_section_ids: additional,
      fee_snapshot: quoted.fee_snapshot,
      intake_state: lead.fee_captured ? "needs_section" : quoted.intake_state,
    })
    .eq("id", input.registrationId);
  if (error) {
    logSupabaseClientError("assignRegistrationSection:update", error, {
      registrationId: input.registrationId,
    });
    return { ok: false, code: "save_failed" };
  }
  void recordSystemAudit({
    action: "registration_section_assigned",
    resourceType: "registration",
    resourceId: input.registrationId,
    payload: { section_id: input.sectionId },
  });
  if (lead.fee_captured) {
    const dict = await getDictionary(input.locale);
    const result = await acceptRegistrationLead({
      admin,
      enrollClient: auth.session,
      locale: input.locale,
      dict,
      registrationId: input.registrationId,
      paidCapture: true,
    });
    if (!result.ok) return { ok: false, code: "accept_failed" };
  }
  revalidateRegistrationInbox(input.locale);
  return { ok: true };
}

export async function registrationEnrollmentReceiptUrlAction(
  registrationId: string,
): Promise<{ ok: true; url: string } | { ok: false; code: string }> {
  const auth = await requireRegistrationIntakeAdmin();
  if (!auth.ok) return auth;
  const lead = await loadRegistrationIntakeLead(createAdminClient(), registrationId);
  const url = await receiptSignedUrlForAdmin(lead?.enrollment_fee_receipt_path ?? null);
  if (!url) return { ok: false, code: "not_found" };
  return { ok: true, url };
}

export async function startRegistrationEnrollmentFeeFlowAction(input: {
  locale: string;
  registrationId: string;
}): Promise<IntakeActionResult> {
  const auth = await requireRegistrationIntakeAdmin();
  if (!auth.ok) return auth;
  const dict = await getDictionary(input.locale);
  const result = await startAdminRegistrationEnrollmentFeeFlow({
    admin: createAdminClient(),
    locale: input.locale,
    dict,
    registrationId: input.registrationId,
  });
  if (!result.ok) return result;
  revalidateRegistrationInbox(input.locale);
  return { ok: true };
}
