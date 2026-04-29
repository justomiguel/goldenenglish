import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinanceReceiptProcessingStats } from "@/types/financeAnalytics";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

interface RpcResult {
  ok: boolean;
  monthly?: {
    avgDays: number | null;
    approvedCount: number;
    rejectedCount: number;
    totalResolved: number;
  };
  invoice?: {
    avgDays: number | null;
    approvedCount: number;
    rejectedCount: number;
    totalResolved: number;
  };
  rejectionBreakdown?: Record<string, number>;
  pending?: {
    total: number;
    bucket0_24h: number;
    bucket24_72h: number;
    bucket72hPlus: number;
  };
}

export async function loadFinanceReceiptProcessingStats(
  supabase: SupabaseClient,
  cohortId: string,
  year: number,
): Promise<FinanceReceiptProcessingStats | null> {
  const { data, error } = await supabase.rpc(
    "admin_finance_receipt_processing_stats",
    { p_cohort_id: cohortId, p_year: year },
  );

  if (error) {
    logSupabaseClientError("loadFinanceReceiptProcessingStats", error, {
      cohortId,
      year,
    });
    return null;
  }

  const raw = data as RpcResult | null;
  if (!raw?.ok) return null;

  const mApproved = raw.monthly?.approvedCount ?? 0;
  const mRejected = raw.monthly?.rejectedCount ?? 0;
  const iApproved = raw.invoice?.approvedCount ?? 0;
  const iRejected = raw.invoice?.rejectedCount ?? 0;
  const totalResolved = mApproved + mRejected + iApproved + iRejected;
  const totalApproved = mApproved + iApproved;

  return {
    avgDaysMonthly: raw.monthly?.avgDays ?? null,
    avgDaysInvoice: raw.invoice?.avgDays ?? null,
    approvalRate: totalResolved > 0 ? totalApproved / totalResolved : 0,
    rejectionRate:
      totalResolved > 0 ? (mRejected + iRejected) / totalResolved : 0,
    totalResolved,
    totalPending: raw.pending?.total ?? 0,
    rejectionBreakdown: raw.rejectionBreakdown ?? {},
    pendingAgeBuckets: [
      { label: "0-24h", count: raw.pending?.bucket0_24h ?? 0 },
      { label: "24-72h", count: raw.pending?.bucket24_72h ?? 0 },
      { label: "72h+", count: raw.pending?.bucket72hPlus ?? 0 },
    ],
  };
}
