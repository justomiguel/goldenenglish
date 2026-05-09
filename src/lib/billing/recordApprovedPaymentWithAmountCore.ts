import type { SupabaseClient } from "@supabase/supabase-js";
import { auditFinanceAction } from "@/lib/audit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { isStudentActivelyEnrolledInSection } from "@/lib/billing/resolveSectionPlanMonthlyAmount";

export type RecordApprovedPaymentWithAmountResult =
  | { success: true; paymentId: string }
  | { success: false; code: "not_a_student" | "not_enrolled" | "already_approved" | "cannot_override_exempt" | "save_failed" };

/**
 * Admin-only: set a month to approved with an explicit amount (annual settlement allocation).
 */
export async function recordApprovedPaymentWithAmount(
  supabase: SupabaseClient,
  input: {
    studentId: string;
    sectionId: string;
    year: number;
    month: number;
    amount: number;
    adminNote: string | null;
    actorId: string;
    correlationId: string | null;
  },
): Promise<RecordApprovedPaymentWithAmountResult> {
  const { studentId, sectionId, year, month, amount, adminNote, actorId, correlationId } = input;
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", studentId)
    .single();
  if (prof?.role !== "student") return { success: false, code: "not_a_student" };

  if (!(await isStudentActivelyEnrolledInSection(supabase, studentId, sectionId))) {
    return { success: false, code: "not_enrolled" };
  }

  const { data: payRow } = await supabase
    .from("payments")
    .select("id, status, amount, admin_notes")
    .eq("student_id", studentId)
    .eq("section_id", sectionId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (payRow?.status === "approved") return { success: false, code: "already_approved" };
  if (payRow?.status === "exempt") return { success: false, code: "cannot_override_exempt" };

  let paymentId: string;
  if (payRow) {
    paymentId = payRow.id as string;
    const { error } = await supabase
      .from("payments")
      .update({
        status: "approved",
        amount,
        admin_notes: adminNote,
      })
      .eq("id", paymentId)
      .in("status", ["pending", "rejected"] as const);
    if (error) {
      logSupabaseClientError("recordApprovedPaymentWithAmount:update", error, { studentId, month });
      return { success: false, code: "save_failed" };
    }
  } else {
    const { data: ins, error: insErr } = await supabase
      .from("payments")
      .insert({
        student_id: studentId,
        section_id: sectionId,
        year,
        month,
        amount,
        status: "approved",
        admin_notes: adminNote,
      })
      .select("id")
      .single();
    if (insErr || !ins?.id) {
      if (insErr)
        logSupabaseClientError("recordApprovedPaymentWithAmount:insert", insErr, { studentId, month });
      return { success: false, code: "save_failed" };
    }
    paymentId = ins.id as string;
  }

  const audit = await auditFinanceAction({
    actorId,
    actorRole: "admin",
    action: payRow ? "update" : "create",
    resourceType: "payment",
    resourceId: paymentId,
    summary: "Admin recorded monthly payment (annual settlement allocation)",
    beforeValues: payRow
      ? { status: String(payRow.status), amount: payRow.amount }
      : { status: null, amount: null },
    afterValues: { status: "approved", amount },
    metadata: {
      student_id: studentId,
      month,
      year,
      section_id: sectionId,
      mode: "annual_settlement",
    },
    correlationId,
  });
  if (!audit?.ok) {
    if (payRow) {
      await supabase
        .from("payments")
        .update({
          status: String(payRow.status),
          amount: payRow.amount as number | null,
          admin_notes: (payRow.admin_notes as string | null) ?? null,
        })
        .eq("id", paymentId);
    } else {
      await supabase.from("payments").delete().eq("id", paymentId);
    }
    return { success: false, code: "save_failed" };
  }

  return { success: true, paymentId };
}
