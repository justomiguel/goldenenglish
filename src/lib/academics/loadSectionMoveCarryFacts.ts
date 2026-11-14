import type { SupabaseClient } from "@supabase/supabase-js";
import type { MovePaymentRow, MoveScholarshipRow } from "@/lib/academics/planSectionMoveCarry";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type SectionMoveCarryFacts = {
  originPayments: MovePaymentRow[];
  destinationPayments: MovePaymentRow[];
  originScholarships: MoveScholarshipRow[];
  destinationScholarships: { id: string }[];
};

type PaymentFact = { id: string; section_id: string; month: number; year: number };
type ScholarshipFact = { id: string; enrollment_id: string; is_active: boolean; discount_percent: number };

export async function loadSectionMoveCarryFacts(
  supabase: SupabaseClient,
  input: { studentId: string; toSectionId: string; fromEnrollmentIds: string[] },
): Promise<{ ok: true; facts: SectionMoveCarryFacts } | { ok: false; code: "save_failed" | "not_found" }> {
  const originSectionIds: string[] = [];
  if (input.fromEnrollmentIds.length > 0) {
    const enrolled = await supabase
      .from("section_enrollments")
      .select("id, section_id")
      .eq("student_id", input.studentId)
      .eq("status", "active")
      .in("id", input.fromEnrollmentIds);
    if (enrolled.error) {
      await logSupabaseClientError("loadSectionMoveCarryFacts", enrolled.error, { studentId: input.studentId });
      return { ok: false, code: "save_failed" };
    }
    const rows = (enrolled.data ?? []) as { id: string; section_id: string }[];
    if (rows.length !== input.fromEnrollmentIds.length) return { ok: false, code: "not_found" };
    for (const row of rows) originSectionIds.push(row.section_id);
  }

  const sectionIds = [...new Set([...originSectionIds, input.toSectionId])];
  const payments = await supabase
    .from("payments")
    .select("id, section_id, month, year")
    .eq("student_id", input.studentId)
    .in("section_id", sectionIds)
    .is("superseded_at", null);
  if (payments.error) {
    await logSupabaseClientError("loadSectionMoveCarryFacts", payments.error, { studentId: input.studentId });
    return { ok: false, code: "save_failed" };
  }

  const originSet = new Set(originSectionIds);
  const originPayments: MovePaymentRow[] = [];
  const destinationPayments: MovePaymentRow[] = [];
  for (const row of (payments.data ?? []) as PaymentFact[]) {
    const item = { id: row.id, month: row.month, year: row.year };
    if (row.section_id === input.toSectionId) destinationPayments.push(item);
    if (originSet.has(row.section_id)) originPayments.push(item);
  }

  let originScholarships: MoveScholarshipRow[] = [];
  if (input.fromEnrollmentIds.length > 0) {
    const origin = await supabase
      .from("section_enrollment_scholarships")
      .select("id, enrollment_id, is_active, discount_percent")
      .in("enrollment_id", input.fromEnrollmentIds);
    if (origin.error) {
      await logSupabaseClientError("loadSectionMoveCarryFacts", origin.error, { studentId: input.studentId });
      return { ok: false, code: "save_failed" };
    }
    originScholarships = ((origin.data ?? []) as ScholarshipFact[])
      .filter((row) => row.is_active)
      .map((row) => ({ id: row.id, discountPercent: Number(row.discount_percent) }));
  }

  const destination = await supabase
    .from("section_enrollment_scholarships")
    .select("id")
    .eq("student_id", input.studentId)
    .eq("section_id", input.toSectionId)
    .eq("is_active", true);
  if (destination.error) {
    await logSupabaseClientError("loadSectionMoveCarryFacts", destination.error, { studentId: input.studentId });
    return { ok: false, code: "save_failed" };
  }

  return {
    ok: true,
    facts: {
      originPayments,
      destinationPayments,
      originScholarships,
      destinationScholarships: (destination.data ?? []) as { id: string }[],
    },
  };
}
