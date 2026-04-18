import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  isStudentActivelyEnrolledInSection,
  resolveSectionPlanMonthlyAmount,
} from "@/lib/billing/resolveSectionPlanMonthlyAmount";

/** Postgres `unique_violation`; PostgREST surfaces it on `error.code`. */
const PG_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: unknown }).code === PG_UNIQUE_VIOLATION
  );
}

export interface StudentPaymentSlotInput {
  studentId: string;
  /** When set, the payment row is scoped to that section (new model). */
  sectionId: string | null;
  month: number;
  year: number;
  /**
   * Amount declared in the form. For sections with a fee plan it is overridden
   * by the plan amount (after scholarship); used as fallback for legacy rows.
   */
  fallbackAmount: number;
}

export type StudentPaymentSlotResult =
  | {
      ok: true;
      payment: { id: string; status: string };
      effectiveAmount: number;
    }
  | {
      ok: false;
      reason:
        | "forbidden"
        | "no_plan"
        | "out_of_period"
        | "slot_not_found"
        | "already_processed"
        | "upload_failed"
        | "select_failed";
    };

/**
 * Locate or create the {@link StudentPaymentSlotResult.payment} row for a
 * receipt upload. When `sectionId` is provided, fee/period are validated against
 * the section fee plan and the row is auto-created if missing (per
 * `054_section_fee_plans.sql`). Without `sectionId` we fall back to legacy
 * single-section rows that must already exist in `pending` state.
 */
export async function resolveStudentPaymentSlot(
  supabase: SupabaseClient,
  input: StudentPaymentSlotInput,
): Promise<StudentPaymentSlotResult> {
  const { studentId, sectionId, month, year, fallbackAmount } = input;

  if (sectionId) {
    const isEnrolled = await isStudentActivelyEnrolledInSection(supabase, studentId, sectionId);
    if (!isEnrolled) return { ok: false, reason: "forbidden" };
    const planAmount = await resolveSectionPlanMonthlyAmount(
      supabase,
      studentId,
      sectionId,
      year,
      month,
    );
    if (planAmount.code === "no_plan") return { ok: false, reason: "no_plan" };
    if (planAmount.code === "out_of_period") return { ok: false, reason: "out_of_period" };

    const { data: existing, error: selErr } = await supabase
      .from("payments")
      .select("id, status")
      .eq("student_id", studentId)
      .eq("section_id", sectionId)
      .eq("month", month)
      .eq("year", year)
      .maybeSingle();
    if (selErr) {
      logSupabaseClientError("resolveStudentPaymentSlot:select", selErr, { studentId });
      return { ok: false, reason: "select_failed" };
    }
    if (!existing) {
      const { data: created, error: insErr } = await supabase
        .from("payments")
        .insert({
          student_id: studentId,
          section_id: sectionId,
          month,
          year,
          amount: planAmount.amount,
          status: "pending",
        })
        .select("id, status")
        .single();
      if (insErr) {
        // Idempotent retry: a concurrent submitter (double click, retry, second
        // tutor) may have created the same (student, section, month, year) row
        // between our SELECT and INSERT. Postgres signals it with
        // unique_violation = 23505, enforced by the partial unique indexes
        // payments_student_section_period_uidx / *_legacy_period_uidx
        // (migration 054). Equivalent semantics to
        // `INSERT ... ON CONFLICT (...) DO NOTHING` followed by SELECT: read
        // the row the racing peer wrote and let the caller's UPDATE attach
        // the receipt to the same pending slot.
        if (isUniqueViolation(insErr)) {
          const { data: raced, error: raceErr } = await supabase
            .from("payments")
            .select("id, status")
            .eq("student_id", studentId)
            .eq("section_id", sectionId)
            .eq("month", month)
            .eq("year", year)
            .maybeSingle();
          if (raceErr || !raced) {
            logSupabaseClientError("resolveStudentPaymentSlot:insert", insErr, { studentId });
            return { ok: false, reason: "upload_failed" };
          }
          if (raced.status !== "pending") {
            return { ok: false, reason: "already_processed" };
          }
          return {
            ok: true,
            payment: { id: raced.id as string, status: raced.status as string },
            effectiveAmount: planAmount.amount,
          };
        }
        logSupabaseClientError("resolveStudentPaymentSlot:insert", insErr, { studentId });
        return { ok: false, reason: "upload_failed" };
      }
      if (!created) return { ok: false, reason: "upload_failed" };
      return {
        ok: true,
        payment: { id: created.id as string, status: created.status as string },
        effectiveAmount: planAmount.amount,
      };
    }
    if (existing.status !== "pending") return { ok: false, reason: "already_processed" };
    return {
      ok: true,
      payment: { id: existing.id as string, status: existing.status as string },
      effectiveAmount: planAmount.amount,
    };
  }

  const { data: legacy, error: payErr } = await supabase
    .from("payments")
    .select("id, status")
    .eq("student_id", studentId)
    .is("section_id", null)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();
  if (payErr) {
    logSupabaseClientError("resolveStudentPaymentSlot:select_legacy", payErr, { studentId });
    return { ok: false, reason: "select_failed" };
  }
  if (!legacy) return { ok: false, reason: "slot_not_found" };
  if (legacy.status !== "pending") return { ok: false, reason: "already_processed" };
  return {
    ok: true,
    payment: { id: legacy.id as string, status: legacy.status as string },
    effectiveAmount: fallbackAmount,
  };
}
