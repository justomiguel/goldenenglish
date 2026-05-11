import type { SupabaseClient } from "@supabase/supabase-js";
import { auditFinanceAction } from "@/lib/audit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const TAG_PREFIX = "annual_settlement:";

export type AnnualSettlementDeleteFailureCode =
  | "count_failed"
  | "scope_mismatch"
  | "delete_failed"
  | "still_has_approved_payments";

export type DeleteAnnualSettlementIfNoTaggedApprovedResult =
  | { ok: true; hadRow: boolean }
  | { ok: false; code: AnnualSettlementDeleteFailureCode };

/** Extract annual settlement UUID embedded in payment admin notes (applyAnnualTuitionSettlement). */
export function parseAnnualSettlementIdFromAdminNotes(notes: string | null | undefined): string | null {
  if (!notes?.trim()) return null;
  const i = notes.indexOf(TAG_PREFIX);
  if (i === -1) return null;
  const rest = notes.slice(i + TAG_PREFIX.length);
  const m = rest.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  );
  return m ? m[1].toLowerCase() : null;
}

/**
 * Deletes the settlement row (and resets enrollment fee flags when applicable) only when
 * there are no approved monthly payments left that carry `annual_settlement:{id}` in admin_notes.
 */
export async function deleteAnnualSettlementIfNoTaggedApprovedPaymentsRemain(
  supabase: SupabaseClient,
  args: {
    settlementId: string;
    studentId: string;
    sectionId: string;
    actorId: string;
    auditMetadataReason: "all_settlement_tagged_payments_reverted" | "admin_removed_settlement";
  },
): Promise<DeleteAnnualSettlementIfNoTaggedApprovedResult> {
  const likePattern = `%${TAG_PREFIX}${args.settlementId}%`;

  const { count, error: cntErr } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("student_id", args.studentId)
    .eq("section_id", args.sectionId)
    .eq("status", "approved")
    .like("admin_notes", likePattern);

  if (cntErr) {
    logSupabaseClientError("deleteAnnualSettlementIfNoTaggedApprovedPaymentsRemain:count", cntErr, {
      settlementId: args.settlementId,
    });
    return { ok: false, code: "count_failed" };
  }
  if ((count ?? 0) > 0) {
    return { ok: false, code: "still_has_approved_payments" };
  }

  const { data: row, error: loadErr } = await supabase
    .from("section_enrollment_annual_settlements")
    .select("id, enrollment_id, student_id, section_id, includes_enrollment_fee, coverage_from_year")
    .eq("id", args.settlementId)
    .maybeSingle();

  if (loadErr) {
    logSupabaseClientError("deleteAnnualSettlementIfNoTaggedApprovedPaymentsRemain:load", loadErr, {
      settlementId: args.settlementId,
    });
    return { ok: false, code: "count_failed" };
  }
  if (!row) {
    return { ok: true, hadRow: false };
  }

  if (row.student_id !== args.studentId || row.section_id !== args.sectionId) {
    logSupabaseClientError(
      "deleteAnnualSettlementIfNoTaggedApprovedPaymentsRemain:mismatch",
      new Error("scope"),
      { settlementId: args.settlementId },
    );
    return { ok: false, code: "scope_mismatch" };
  }

  const { error: delErr } = await supabase
    .from("section_enrollment_annual_settlements")
    .delete()
    .eq("id", args.settlementId);

  if (delErr) {
    logSupabaseClientError("deleteAnnualSettlementIfNoTaggedApprovedPaymentsRemain:delete", delErr, {
      settlementId: args.settlementId,
    });
    return { ok: false, code: "delete_failed" };
  }

  if (row.includes_enrollment_fee) {
    const { error: feeErr } = await supabase
      .from("section_enrollments")
      .update({
        enrollment_fee_receipt_status: "pending",
        last_enrollment_paid_at: null,
      })
      .eq("id", row.enrollment_id);
    if (feeErr) {
      logSupabaseClientError("deleteAnnualSettlementIfNoTaggedApprovedPaymentsRemain:feeReset", feeErr, {
        enrollmentId: row.enrollment_id,
      });
    }
  }

  void auditFinanceAction({
    actorId: args.actorId,
    actorRole: "admin",
    action: "delete",
    resourceType: "annual_settlement",
    resourceId: args.settlementId,
    summary:
      args.auditMetadataReason === "admin_removed_settlement"
        ? "Annual tuition settlement removed by admin"
        : "Annual tuition settlement removed after all linked payments reverted",
    beforeValues: {
      coverage_from_year: row.coverage_from_year,
      includes_enrollment_fee: row.includes_enrollment_fee,
    },
    metadata: {
      student_id: args.studentId,
      section_id: args.sectionId,
      reason: args.auditMetadataReason,
    },
    correlationId: args.settlementId,
  });

  return { ok: true, hadRow: true };
}

export function annualSettlementTagLikePattern(settlementId: string): string {
  return `%${TAG_PREFIX}${settlementId}%`;
}
