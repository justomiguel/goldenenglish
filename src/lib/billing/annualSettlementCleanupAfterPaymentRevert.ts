import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deleteAnnualSettlementIfNoTaggedApprovedPaymentsRemain,
  parseAnnualSettlementIdFromAdminNotes,
} from "@/lib/billing/annualSettlementDelete";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

export { parseAnnualSettlementIdFromAdminNotes } from "@/lib/billing/annualSettlementDelete";

/**
 * When the last approved payment tied to an annual settlement is reverted, remove the settlement row
 * so overlap checks and billing math no longer treat the deal as active (see applyAnnualTuitionSettlement).
 * Best-effort: never throws; logs failures.
 */
export async function maybeRemoveAnnualSettlementIfFullyReverted(
  supabase: SupabaseClient,
  args: {
    studentId: string;
    sectionId: string;
    previousAdminNotes: string | null;
    actorId: string;
  },
): Promise<void> {
  const settlementId = parseAnnualSettlementIdFromAdminNotes(args.previousAdminNotes);
  if (!settlementId) return;

  try {
    const r = await deleteAnnualSettlementIfNoTaggedApprovedPaymentsRemain(supabase, {
      settlementId,
      studentId: args.studentId,
      sectionId: args.sectionId,
      actorId: args.actorId,
      auditMetadataReason: "all_settlement_tagged_payments_reverted",
    });
    if (r.ok || r.code === "still_has_approved_payments") {
      return;
    }
    logSupabaseClientError("maybeRemoveAnnualSettlementIfFullyReverted:delete", new Error(r.code), {
      settlementId,
    });
  } catch (e) {
    logServerException("maybeRemoveAnnualSettlementIfFullyReverted", e, { settlementId });
  }
}
