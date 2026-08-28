import type { SupabaseClient } from "@supabase/supabase-js";
import { amountsMatchForCurrency } from "@/lib/billing/upsertApprovedMonthlyPaymentSupport";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { acceptRegistrationLead } from "@/lib/register/acceptRegistrationLead";
import { requestedSectionsHaveOpenSeats } from "@/lib/register/requestedSectionsHaveOpenSeats";

export type ApplyEnrollmentGatewayCaptureResult =
  | { ok: true; skipped?: string; studentId?: string }
  | { ok: false };

export async function applyEnrollmentGatewayCapture(input: {
  admin: SupabaseClient;
  registrationId: string;
  gatewayAmount: number;
  gatewayCurrency: string;
  locale: string;
}): Promise<ApplyEnrollmentGatewayCaptureResult> {
  const { data, error } = await input.admin
    .from("registrations")
    .select(
      "id, status, intake_state, fee_captured, accepted_student_id, fee_snapshot, preferred_section_id, additional_section_ids",
    )
    .eq("id", input.registrationId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("applyEnrollmentGatewayCapture:select", error, {
      registrationId: input.registrationId,
    });
    return { ok: false };
  }
  if (!data) return { ok: true, skipped: "not_found" };

  const row = data as Record<string, unknown>;
  if (String(row.status ?? "") === "enrolled") {
    const studentId =
      row.accepted_student_id == null ? undefined : String(row.accepted_student_id);
    return { ok: true, skipped: "already_enrolled", studentId };
  }

  const snapshot = (row.fee_snapshot ?? {}) as { total?: unknown; currency?: unknown };
  const expected = Number(snapshot.total ?? 0);
  const currency = String(snapshot.currency ?? input.gatewayCurrency).toUpperCase();
  if (
    !(expected > 0) ||
    !amountsMatchForCurrency(expected, input.gatewayAmount, currency)
  ) {
    return { ok: true, skipped: "amount_mismatch" };
  }

  const { error: captureErr } = await input.admin
    .from("registrations")
    .update({ fee_captured: true })
    .eq("id", input.registrationId);
  if (captureErr) {
    logSupabaseClientError("applyEnrollmentGatewayCapture:capture", captureErr, {
      registrationId: input.registrationId,
    });
    return { ok: false };
  }

  const sectionIds = [
    row.preferred_section_id == null ? null : String(row.preferred_section_id),
    ...(Array.isArray(row.additional_section_ids)
      ? row.additional_section_ids.map((id) => String(id))
      : []),
  ].filter((id): id is string => Boolean(id));

  const open = await requestedSectionsHaveOpenSeats(input.admin, sectionIds);
  if (sectionIds.length > 0 && !open) {
    const { error: fullErr } = await input.admin
      .from("registrations")
      .update({ intake_state: "section_full" })
      .eq("id", input.registrationId);
    if (fullErr) {
      logSupabaseClientError("applyEnrollmentGatewayCapture:full", fullErr, {
        registrationId: input.registrationId,
      });
      return { ok: false };
    }
    return { ok: true, skipped: "section_full" };
  }

  const dict = await getDictionary(input.locale);
  const accepted = await acceptRegistrationLead({
    admin: input.admin,
    enrollClient: input.admin,
    locale: input.locale,
    dict,
    registrationId: input.registrationId,
    paidCapture: true,
    enrollServiceRole: true,
  });
  if (!accepted.ok) return { ok: false };
  return { ok: true, studentId: accepted.studentId };
}
