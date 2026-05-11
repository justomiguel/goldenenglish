import type { SupabaseClient } from "@supabase/supabase-js";
import { auditFinanceAction } from "@/lib/audit";
import { maybeRemoveAnnualSettlementIfFullyReverted } from "@/lib/billing/annualSettlementCleanupAfterPaymentRevert";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type RevertApprovedPaymentErrorCode =
  | "not_a_student"
  | "not_found"
  | "not_approved"
  | "save_failed";

export interface RevertOneApprovedPaymentInput {
  studentId: string;
  sectionId: string;
  year: number;
  month: number;
  adminNote: string | null;
  actorId: string;
  correlationId: string | null;
}

export type RevertOneApprovedPaymentResult =
  | { success: true; paymentId: string; month: number }
  | { success: false; code: RevertApprovedPaymentErrorCode; month: number };

/**
 * Sets an **approved** monthly `payments` row back to **pending** (not paid for collection purposes).
 * Requires finance audit; rolls back the status change if audit insert fails.
 */
export async function revertOneApprovedPayment(
  supabase: SupabaseClient,
  input: RevertOneApprovedPaymentInput,
): Promise<RevertOneApprovedPaymentResult> {
  const m = input.month;
  const y = input.year;

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", input.studentId)
    .single();
  if (prof?.role !== "student") {
    return { success: false, code: "not_a_student", month: m };
  }

  const { data: payRow } = await supabase
    .from("payments")
    .select("id, status, amount, admin_notes, receipt_url")
    .eq("student_id", input.studentId)
    .eq("section_id", input.sectionId)
    .eq("year", y)
    .eq("month", m)
    .maybeSingle();

  if (!payRow?.id) {
    return { success: false, code: "not_found", month: m };
  }
  if (payRow.status !== "approved") {
    return { success: false, code: "not_approved", month: m };
  }

  const paymentId = payRow.id as string;
  const note = input.adminNote?.trim() || null;
  const prevNotes = (payRow.admin_notes as string | null)?.trim() || null;
  const nextNotes =
    note && prevNotes ? `${prevNotes}\n[revert] ${note}` : note ? `[revert] ${note}` : prevNotes;

  const { error } = await supabase
    .from("payments")
    .update({
      status: "pending",
      admin_notes: nextNotes,
    })
    .eq("id", paymentId)
    .eq("status", "approved");

  if (error) {
    logSupabaseClientError("revertOneApprovedPayment:update", error, {
      studentId: input.studentId,
      month: m,
    });
    return { success: false, code: "save_failed", month: m };
  }

  const audit = await auditFinanceAction({
    actorId: input.actorId,
    actorRole: "admin",
    action: "update",
    resourceType: "payment",
    resourceId: paymentId,
    summary: "Admin reverted approved monthly payment to pending",
    beforeValues: {
      status: "approved",
      admin_notes: payRow.admin_notes ?? null,
      amount: payRow.amount ?? null,
    },
    afterValues: {
      status: "pending",
      admin_notes: nextNotes,
      amount: payRow.amount ?? null,
    },
    metadata: {
      student_id: input.studentId,
      month: m,
      year: y,
      section_id: input.sectionId,
      had_receipt: Boolean(payRow.receipt_url),
    },
    correlationId: input.correlationId,
  });

  if (!audit?.ok) {
    await supabase
      .from("payments")
      .update({
        status: "approved",
        admin_notes: (payRow.admin_notes as string | null) ?? null,
      })
      .eq("id", paymentId);
    return { success: false, code: "save_failed", month: m };
  }

  await maybeRemoveAnnualSettlementIfFullyReverted(supabase, {
    studentId: input.studentId,
    sectionId: input.sectionId,
    previousAdminNotes: (payRow.admin_notes as string | null) ?? null,
    actorId: input.actorId,
  });

  return { success: true, paymentId, month: m };
}
