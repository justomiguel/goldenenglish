"use server";

import { todayIsoDate } from "@/lib/billing/paymentMethod";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { loadRegistrationCashMatriculaAmounts } from "@/lib/register/loadRegistrationCashMatriculaAmounts";
import { registrationMatriculaAmount } from "@/lib/register/registrationMatriculaAlta";
import { acceptRegistrationLead } from "@/lib/register/acceptRegistrationLead";
import {
  loadRegistrationIntakeLead,
  requireRegistrationIntakeAdmin,
  revalidateRegistrationInbox,
} from "@/lib/register/registrationIntakeActionSupport";
import { snapshotTotalFromUnknown } from "@/lib/register/registrationIntake";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markRegistrationPaidInPersonAction(input: {
  locale: string;
  registrationId: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const auth = await requireRegistrationIntakeAdmin();
  if (!auth.ok) return auth;
  const admin = await createAdminClient();
  const lead = await loadRegistrationIntakeLead(admin, input.registrationId);
  if (!lead) return { ok: false, code: "not_found" };
  if (lead.fee_captured === true) return { ok: false, code: "already_paid" };
  if (String(lead.status) === "enrolled") return { ok: false, code: "already_enrolled" };

  const live = await loadRegistrationCashMatriculaAmounts(admin, lead.preferred_section_id);
  const amount = registrationMatriculaAmount({
    cohortAmount: live.cohortAmount,
    sectionAmount: live.sectionAmount,
    snapshotTotal: snapshotTotalFromUnknown(lead.fee_snapshot),
  });
  if (!(amount > 0)) return { ok: false, code: "no_fee" };

  const paidOn = todayIsoDate();
  const { error } = await admin
    .from("registrations")
    .update({
      fee_captured: true,
      enrollment_fee_paid_method: "cash",
      enrollment_fee_paid_amount: amount,
      enrollment_fee_paid_on: paidOn,
    })
    .eq("id", input.registrationId);
  if (error) {
    logSupabaseClientError("markRegistrationPaidInPerson:capture", error, {
      registrationId: input.registrationId,
    });
    return { ok: false, code: "save_failed" };
  }

  const dict = await getDictionary(input.locale);
  const accepted = await acceptRegistrationLead({
    admin,
    enrollClient: auth.session,
    locale: input.locale,
    dict,
    registrationId: input.registrationId,
    paidCapture: true,
    feePayment: { method: "cash", amount, paidOn },
    actorId: auth.userId,
  });
  if (!accepted.ok) return { ok: false, code: "accept_failed" };
  revalidateRegistrationInbox(input.locale);
  return { ok: true };
}
