import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

/**
 * Reserves a readable Flow commerceOrder mapped to an existing legacy `payments.id`.
 * Prefer {@link reservePaymentFlowCommerceReferenceForSlot} for the deferred-creation
 * model where no payment row exists at checkout time.
 */
export async function reservePaymentFlowCommerceReference(
  admin: SupabaseClient,
  input: { paymentId: string; year: number; month: number },
): Promise<{ ok: true; commerceRef: string } | { ok: false }> {
  const { data, error } = await admin.rpc("payment_flow_reserve_commerce_ref", {
    p_payment_id: input.paymentId,
    p_year: input.year,
    p_month: input.month,
  });

  if (error || typeof data !== "string" || data.trim().length < 12) {
    logSupabaseClientError("reservePaymentFlowCommerceReference:rpc", error ?? {}, {
      payment_id: input.paymentId,
    });
    return { ok: false };
  }

  return { ok: true, commerceRef: data.trim() };
}

/**
 * Reserves a readable Flow commerceOrder mapped to a deferred tuition slot
 * (student/section/year/month) without a pre-existing `payments` row. The row is
 * materialized as `approved` on gateway confirmation via
 * {@link upsertApprovedMonthlyPaymentCore}.
 */
export async function reservePaymentFlowCommerceReferenceForSlot(
  admin: SupabaseClient,
  input: {
    studentId: string;
    sectionId: string;
    year: number;
    month: number;
    parentId?: string | null;
  },
): Promise<{ ok: true; commerceRef: string } | { ok: false }> {
  const { data, error } = await admin.rpc("payment_flow_reserve_commerce_ref_slot", {
    p_student_id: input.studentId,
    p_section_id: input.sectionId,
    p_year: input.year,
    p_month: input.month,
    p_parent_id: input.parentId ?? null,
  });

  if (error || typeof data !== "string" || data.trim().length < 12) {
    logSupabaseClientError("reservePaymentFlowCommerceReferenceForSlot:rpc", error ?? {}, {
      student_id: input.studentId,
      section_id: input.sectionId,
    });
    return { ok: false };
  }

  return { ok: true, commerceRef: data.trim() };
}
