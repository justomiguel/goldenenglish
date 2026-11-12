import type { SupabaseClient } from "@supabase/supabase-js";
import { auditFinanceAction } from "@/lib/audit";
import type { PaymentMethod } from "@/lib/billing/paymentMethod";
import { todayIsoDate } from "@/lib/billing/paymentMethod";
import { logServerError, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  isStudentActivelyEnrolledInSection,
  resolveSectionPlanMonthlyAmount,
} from "@/lib/billing/resolveSectionPlanMonthlyAmount";

export type RecordPaymentWithoutReceiptErrorCode =
  | "not_a_student"
  | "not_enrolled"
  | "no_plan"
  | "out_of_period"
  /** La sección se cobra por bolsa de clases prepagas: no hay cuota mensual que registrar. */
  | "class_pack_section"
  | "exempt_or_zero"
  | "already_approved"
  | "cannot_override_exempt"
  | "save_failed";

export interface RecordOnePaymentInput {
  studentId: string;
  sectionId: string;
  year: number;
  month: number;
  adminNote: string | null;
  paymentMethod?: PaymentMethod;
  paidOn?: string;
  actorId: string;
  /** Same id for all rows in a bulk operation (audit correlation). */
  correlationId: string | null;
}

export type RecordOnePaymentResult =
  | {
      success: true;
      paymentId: string;
      month: number;
      year: number;
      amount: number;
      currency: string;
      sectionName: string;
    }
  | { success: false; code: RecordPaymentWithoutReceiptErrorCode; month: number };

/**
 * Single period: create/update `payments` to approved and **must** call audit
 * before reporting success. Used by one-shot and bulk admin actions.
 */
export async function recordOnePaymentWithoutReceipt(
  supabase: SupabaseClient,
  input: RecordOnePaymentInput,
): Promise<RecordOnePaymentResult> {
  const p = input;
  const m = p.month;
  const y = p.year;

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", p.studentId)
    .single();
  if (prof?.role !== "student") {
    return { success: false, code: "not_a_student", month: m };
  }

  if (!(await isStudentActivelyEnrolledInSection(supabase, p.studentId, p.sectionId))) {
    return { success: false, code: "not_enrolled", month: m };
  }

  const plan = await resolveSectionPlanMonthlyAmount(
    supabase,
    p.studentId,
    p.sectionId,
    y,
    m,
    { billingScope: "plan-year" },
  );
  // Exhaustivo: un código nuevo en `SectionPlanAmountResult` rompe la compilación aquí hasta que se lo
  // trate, en vez de convertirse en un pago aprobado con un monto que nadie resolvió.
  if (plan.code !== "ok") return { success: false, code: plan.code, month: m };
  if (plan.amount <= 0) return { success: false, code: "exempt_or_zero", month: m };

  const { data: secRow } = await supabase
    .from("academic_sections")
    .select("name")
    .eq("id", p.sectionId)
    .maybeSingle();
  const sectionName = (secRow?.name as string | null)?.trim() || "—";

  const { data: payRow } = await supabase
    .from("payments")
    .select("id, status, amount, section_id, admin_notes, payment_method, paid_on")
    .eq("student_id", p.studentId)
    .eq("section_id", p.sectionId)
    .eq("year", y)
    .eq("month", m)
    .maybeSingle();

  if (payRow?.status === "approved")
    return { success: false, code: "already_approved", month: m };
  if (payRow?.status === "exempt")
    return { success: false, code: "cannot_override_exempt", month: m };

  const method = p.paymentMethod ?? "cash";
  const paidOn = p.paidOn ?? todayIsoDate();
  let paymentId: string;
  if (payRow) {
    paymentId = payRow.id as string;
    const { data: updated, error } = await supabase
      .from("payments")
      .update({
        status: "approved",
        amount: plan.amount,
        admin_notes: p.adminNote,
        payment_method: method,
        paid_on: paidOn,
      })
      .eq("id", paymentId)
      .in("status", ["pending", "rejected"] as const)
      .select("id");
    if (error || !updated?.length) {
      if (error) {
        logSupabaseClientError("recordOnePaymentWithoutReceipt:update", error, {
          studentId: p.studentId,
          month: m,
        });
      } else {
        await logServerError("recordOnePaymentWithoutReceipt:update", {
          code: "save_failed",
          studentId: p.studentId,
          month: m,
        });
      }
      return { success: false, code: "save_failed", month: m };
    }
  } else {
    const { data: ins, error: insErr } = await supabase
      .from("payments")
      .insert({
        student_id: p.studentId,
        section_id: p.sectionId,
        year: y,
        month: m,
        amount: plan.amount,
        status: "approved",
        admin_notes: p.adminNote,
        payment_method: method,
        paid_on: paidOn,
      })
      .select("id")
      .single();
    if (insErr || !ins?.id) {
      if (insErr)
        logSupabaseClientError("recordOnePaymentWithoutReceipt:insert", insErr, {
          studentId: p.studentId,
          month: m,
        });
      return { success: false, code: "save_failed", month: m };
    }
    paymentId = ins.id as string;
  }

  const audit = await auditFinanceAction({
    actorId: p.actorId,
    actorRole: "admin",
    action: "approve",
    resourceType: "payment",
    resourceId: paymentId,
    summary: "Admin recorded monthly payment (no receipt workflow)",
    beforeValues: payRow
      ? { status: String(payRow.status), amount: payRow.amount }
      : { status: null, amount: null },
    afterValues: { status: "approved", amount: plan.amount, payment_method: method, paid_on: paidOn },
    metadata: {
      student_id: p.studentId,
      month: m,
      year: y,
      section_id: p.sectionId,
      payment_method: method,
    },
    correlationId: p.correlationId,
  });
  if (!audit?.ok) {
    if (payRow) {
      await supabase
        .from("payments")
        .update({
          status: String(payRow.status),
          amount: payRow.amount as number | null,
          admin_notes: (payRow.admin_notes as string | null) ?? null,
          payment_method: (payRow.payment_method as string | null) ?? null,
          paid_on: (payRow.paid_on as string | null) ?? null,
        })
        .eq("id", paymentId);
    } else {
      await supabase.from("payments").delete().eq("id", paymentId);
    }
    return { success: false, code: "save_failed", month: m };
  }

  return {
    success: true,
    paymentId,
    month: m,
    year: y,
    amount: plan.amount,
    currency: plan.currency,
    sectionName,
  };
}
