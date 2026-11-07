"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { acceptRegistrationLead } from "@/lib/register/acceptRegistrationLead";
import { parseRegistrationIntakeState } from "@/lib/register/registrationIntake";
import {
  loadRegistrationIntakeLead,
  requireRegistrationIntakeAdmin,
  revalidateRegistrationInbox,
} from "@/lib/register/registrationIntakeActionSupport";
import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";
import {
  parsePaidOn,
  parseStaffFeeAmount,
  paymentMethodSchema,
  todayIsoDate,
} from "@/lib/billing/paymentMethod";
import {
  parseJoinDispositionInput,
  type JoinBillingDisposition,
} from "@/lib/billing/joinBillingDispositionSchema";

export type IntakeActionResult = { ok: true } | { ok: false; code: string };

export async function recordRegistrationFeePaymentAction(input: {
  locale: string;
  registrationId: string;
  method: string;
  amount: number;
  paidOn: string;
  note?: string;
  joinDisposition: JoinBillingDisposition;
}): Promise<IntakeActionResult> {
  const method = paymentMethodSchema.safeParse(input.method);
  const amount = parseStaffFeeAmount(input.amount);
  const paidOn = parsePaidOn(input.paidOn, todayIsoDate());
  const disposition = parseJoinDispositionInput(input.joinDisposition);
  if (!method.success || amount == null || !paidOn || !disposition) {
    return { ok: false, code: "validation" };
  }
  const auth = await requireRegistrationIntakeAdmin();
  if (!auth.ok) return auth;
  const admin = await createAdminClient();
  const lead = await loadRegistrationIntakeLead(admin, input.registrationId);
  const state = parseRegistrationIntakeState(lead?.intake_state);
  if (!lead || (state !== "awaiting_fee" && state !== "receipt_pending")) {
    return { ok: false, code: "not_found" };
  }
  const sectionIds = requestedRegistrationSectionIds({
    preferred_section_id: lead.preferred_section_id ?? null,
    additionalSectionIds: lead.additional_section_ids ?? [],
  });
  if (sectionIds.length === 0) return { ok: false, code: "needs_section" };

  const { error } = await admin
    .from("registrations")
    .update({ fee_captured: true })
    .eq("id", input.registrationId);
  if (error) {
    logSupabaseClientError("recordRegistrationFeePayment:capture", error, {
      registrationId: input.registrationId,
    });
    return { ok: false, code: "save_failed" };
  }

  const dict = await getDictionary(input.locale);
  const result = await acceptRegistrationLead({
    admin,
    enrollClient: auth.session,
    locale: input.locale,
    dict,
    registrationId: input.registrationId,
    paidCapture: true,
    feePayment: { method: method.data, amount, paidOn },
    joinDisposition: disposition,
    actorId: auth.userId,
  });
  if (!result.ok) return { ok: false, code: "accept_failed" };
  void recordSystemAudit({
    action: "registration_fee_payment_recorded",
    resourceType: "registration",
    resourceId: input.registrationId,
    payload: {
      student_id: result.studentId,
      method: method.data,
      amount,
      note: input.note?.trim().slice(0, 200) ?? null,
    },
  });
  revalidateRegistrationInbox(input.locale);
  return { ok: true };
}
