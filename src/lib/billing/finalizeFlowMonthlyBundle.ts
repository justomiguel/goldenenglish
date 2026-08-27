import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FlowStatusPayload } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";
import { loadMonthlyCheckoutBundle } from "@/lib/billing/loadMonthlyCheckoutBundle";
import { finalizeMonthlyPaymentBundle } from "@/lib/billing/finalizeMonthlyPaymentBundle";
import type { FinalizeMonthlyBundleResult } from "@/lib/billing/finalizeMonthlyPaymentBundle";

export async function finalizeFlowMonthlyBundle(input: {
  admin: SupabaseClient;
  bundleId: string;
  snapshot: FlowStatusPayload;
}): Promise<FinalizeMonthlyBundleResult> {
  const bundle = await loadMonthlyCheckoutBundle(input.admin, input.bundleId);
  if (!bundle) return { ok: true, skipped: "bundle_not_found" };
  return finalizeMonthlyPaymentBundle({
    admin: input.admin,
    bundle: {
      studentId: bundle.studentId,
      parentId: bundle.parentId,
      year: bundle.year,
      month: bundle.month,
      sectionIds: bundle.sectionIds,
    },
    gatewayAmount: input.snapshot.amount,
    gatewayCurrency: input.snapshot.currency,
    gatewayProvider: "flow",
    source: "flow_cl",
    gatewayPaymentRef: input.snapshot.flowOrder,
  });
}
