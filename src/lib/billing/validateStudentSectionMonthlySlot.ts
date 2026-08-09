import type { SupabaseClient } from "@supabase/supabase-js";
import { assertAdvanceMonthlyPaymentAllowed } from "@/lib/billing/assertAdvanceMonthlyPaymentAllowed";
import {
  isStudentActivelyEnrolledInSection,
  resolveSectionPlanMonthlyAmount,
} from "@/lib/billing/resolveSectionPlanMonthlyAmount";

export type MonthlySlotValidationReason =
  | "forbidden"
  | "no_plan"
  | "out_of_period"
  /** La sección se cobra por bolsa de clases prepagas: no hay cuota mensual que cobrar. */
  | "class_pack_section"
  | "month_exempt"
  | "future_month_not_allowed";

export type MonthlySlotValidationResult =
  | { ok: true; effectiveAmount: number; currency: string }
  | { ok: false; reason: MonthlySlotValidationReason };

/**
 * Validates that a student may be charged for a (section, month, year) slot
 * without creating any `payments` row. Shared by:
 *  - {@link resolveStudentPaymentSlot} (receipt upload → also materializes the row), and
 *  - gateway checkout start (deferred creation → validates only, no row).
 *
 * Checks active enrollment, an effective fee plan, billing period / exemption,
 * and the advance-payment window.
 */
export async function validateStudentSectionMonthlySlot(
  supabase: SupabaseClient,
  input: { studentId: string; sectionId: string; month: number; year: number },
): Promise<MonthlySlotValidationResult> {
  const { studentId, sectionId, month, year } = input;

  const isEnrolled = await isStudentActivelyEnrolledInSection(
    supabase,
    studentId,
    sectionId,
  );
  if (!isEnrolled) return { ok: false, reason: "forbidden" };

  const plan = await resolveSectionPlanMonthlyAmount(
    supabase,
    studentId,
    sectionId,
    year,
    month,
  );
  // Exhaustivo a propósito: `plan.code` cuando no es "ok" es asignable a
  // `MonthlySlotValidationReason`, así que un código nuevo en `SectionPlanAmountResult` rompe la
  // compilación acá hasta que se lo trate, en vez de pasar como cobrable.
  if (plan.code !== "ok") return { ok: false, reason: plan.code };
  if (plan.amount <= 0) return { ok: false, reason: "month_exempt" };

  const now = new Date();
  const advance = await assertAdvanceMonthlyPaymentAllowed(supabase, {
    sectionId,
    year,
    month,
    todayYear: now.getFullYear(),
    todayMonth: now.getMonth() + 1,
  });
  if (!advance.allowed) return { ok: false, reason: "future_month_not_allowed" };

  return { ok: true, effectiveAmount: plan.amount, currency: plan.currency };
}
