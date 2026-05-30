import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export interface EventPaymentsFinanceKpis {
  totalRows: number;
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
  approvedAmount: number;
}

export async function loadEventPaymentsForFinanceKpis(
  adminClient: SupabaseClient,
): Promise<EventPaymentsFinanceKpis> {
  const [{ data: rows, error: rowsError }, { count, error: countError }] = await Promise.all([
    adminClient.from("event_payments").select("status, amount"),
    adminClient.from("event_payments").select("id", { head: true, count: "exact" }),
  ]);

  if (rowsError) {
    logSupabaseClientError("loadEventPaymentsForFinanceKpis:rows", rowsError, {});
    return {
      totalRows: 0,
      totalApproved: 0,
      totalPending: 0,
      totalRejected: 0,
      approvedAmount: 0,
    };
  }
  if (countError) {
    logSupabaseClientError("loadEventPaymentsForFinanceKpis:count", countError, {});
  }

  const parsedRows = rows ?? [];
  let totalApproved = 0;
  let totalPending = 0;
  let totalRejected = 0;
  let approvedAmount = 0;

  for (const row of parsedRows) {
    const status = String(row.status ?? "pending");
    if (status === "approved") {
      totalApproved += 1;
      approvedAmount += Number(row.amount ?? 0);
      continue;
    }
    if (status === "rejected") {
      totalRejected += 1;
      continue;
    }
    totalPending += 1;
  }

  return {
    totalRows: count ?? parsedRows.length,
    totalApproved,
    totalPending,
    totalRejected,
    approvedAmount,
  };
}
