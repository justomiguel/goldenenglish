import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { todayIsoDate } from "@/lib/billing/paymentMethod";
import { amountsMatchForCurrency } from "@/lib/billing/upsertApprovedMonthlyPaymentSupport";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

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
    .update({
      fee_captured: true,
      enrollment_fee_paid_method: "gateway",
      enrollment_fee_paid_amount: expected,
      enrollment_fee_paid_on: todayIsoDate(),
      intake_state: "needs_section",
    })
    .eq("id", input.registrationId);
  if (captureErr) {
    logSupabaseClientError("applyEnrollmentGatewayCapture:capture", captureErr, {
      registrationId: input.registrationId,
    });
    return { ok: false };
  }

  revalidatePath(`/${input.locale}/dashboard/admin/registrations`, "page");
  return { ok: true };
}
