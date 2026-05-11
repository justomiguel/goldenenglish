import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  annualSettlementTagLikePattern,
  deleteAnnualSettlementIfNoTaggedApprovedPaymentsRemain,
} from "@/lib/billing/annualSettlementDelete";
import { revertOneApprovedPayment } from "@/lib/billing/revertApprovedPaymentCore";

export type RemoveAnnualSettlementForAdminErrorCode =
  | "not_found"
  | "scope_mismatch"
  | "revert_failed"
  | "delete_failed";

/**
 * Reverts all monthly payments tagged with this settlement, then removes the settlement row.
 * Idempotent if the settlement row was already removed (e.g. by per-revert cleanup).
 */
export async function removeAnnualSettlementForAdmin(
  supabase: SupabaseClient,
  input: {
    actorId: string;
    studentId: string;
    sectionId: string;
    settlementId: string;
    revertAdminNote: string | null;
  },
): Promise<{ ok: true } | { ok: false; code: RemoveAnnualSettlementForAdminErrorCode; month?: number }> {
  const { data: settlement, error: loadErr } = await supabase
    .from("section_enrollment_annual_settlements")
    .select("id, student_id, section_id")
    .eq("id", input.settlementId)
    .maybeSingle();

  if (loadErr) {
    return { ok: false, code: "delete_failed" };
  }
  if (!settlement) {
    return { ok: false, code: "not_found" };
  }
  if (settlement.student_id !== input.studentId || settlement.section_id !== input.sectionId) {
    return { ok: false, code: "scope_mismatch" };
  }

  const likePattern = annualSettlementTagLikePattern(input.settlementId);

  const { data: monthsRows, error: listErr } = await supabase
    .from("payments")
    .select("year, month")
    .eq("student_id", input.studentId)
    .eq("section_id", input.sectionId)
    .eq("status", "approved")
    .like("admin_notes", likePattern);

  if (listErr) {
    return { ok: false, code: "delete_failed" };
  }

  const sorted = [...(monthsRows ?? [])].sort((a, b) => {
    const y = Number(a.year) - Number(b.year);
    return y !== 0 ? y : Number(a.month) - Number(b.month);
  });

  const batchCorrelation = randomUUID();
  for (const row of sorted) {
    const y = Number(row.year);
    const m = Number(row.month);
    const r = await revertOneApprovedPayment(supabase, {
      studentId: input.studentId,
      sectionId: input.sectionId,
      year: y,
      month: m,
      adminNote: input.revertAdminNote ?? null,
      actorId: input.actorId,
      correlationId: batchCorrelation,
    });
    if (!r.success) {
      return { ok: false, code: "revert_failed", month: r.month };
    }
  }

  const del = await deleteAnnualSettlementIfNoTaggedApprovedPaymentsRemain(supabase, {
    settlementId: input.settlementId,
    studentId: input.studentId,
    sectionId: input.sectionId,
    actorId: input.actorId,
    auditMetadataReason: "admin_removed_settlement",
  });

  if (del.ok) {
    return { ok: true };
  }
  if (del.code === "still_has_approved_payments") {
    return { ok: false, code: "revert_failed" };
  }
  return { ok: false, code: "delete_failed" };
}
