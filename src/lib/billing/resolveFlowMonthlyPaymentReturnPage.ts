import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Buffer } from "node:buffer";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeMonthlyPaymentFromFlowGateway } from "@/lib/billing/finalizeMonthlyPaymentFromFlowGateway";
import { lookupPaymentRowForFlowFinalize } from "@/lib/billing/lookupPaymentRowForFlowFinalize";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { flowChileApiBase, loadFlowChileCredentialsPlain } from "@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain";
import { flowFetchPaymentStatus } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";
import { logServerWarn } from "@/lib/logging/serverActionLog";

const FLOW_PAID = 2;

function logResolve(stage: string, meta: Record<string, unknown>): void {
  logServerWarn("resolveFlowMonthlyPaymentReturnPage:" + stage, meta);
}

export type FlowMonthlyPaymentReturnPageModel =
  | { outcome: "no_token" }
  | { outcome: "misconfigured" }
  | { outcome: "status_failed" }
  | { outcome: "not_paid" }
  | { outcome: "unauthorized_payment" }
  | { outcome: "success"; month: number; year: number; paymentId: string }
  | { outcome: "processing" }
  | { outcome: "reconcile_error" };

/**
 * After Flow redirects the family back (typically `?token=`), sync the payment
 * and choose UI copy. Visibility of `payments` rows follows RLS for the session.
 */
export async function resolveFlowMonthlyPaymentReturnPage(input: {
  supabase: SupabaseClient;
  token: string | undefined;
}): Promise<FlowMonthlyPaymentReturnPageModel> {
  const rawToken = input.token?.trim() ?? "";
  if (!rawToken) {
    logResolve("reject", { outcome: "no_token" });
    return { outcome: "no_token" };
  }

  let rawKey: Buffer;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch {
    logResolve("reject", { outcome: "misconfigured", kind: "no_encryption_key" });
    return { outcome: "misconfigured" };
  }

  const admin = createAdminClient();
  const creds = await loadFlowChileCredentialsPlain(admin, rawKey);
  if (!creds?.enabled) {
    logResolve("reject", { outcome: "misconfigured", kind: "flow_disabled_or_no_creds" });
    return { outcome: "misconfigured" };
  }

  const base = flowChileApiBase(creds);
  const fetched = await flowFetchPaymentStatus({
    apiBaseUrl: base,
    apiKey: creds.apiKey,
    secretKey: creds.secretKey,
    token: rawToken,
  });

  if (!fetched.ok) {
    logResolve("reject", {
      outcome: "status_failed",
      token_len: rawToken.length,
      flow_err: fetched.error.slice(0, 120),
    });
    return { outcome: "status_failed" };
  }

  if (fetched.data.status !== FLOW_PAID) {
    logResolve("reject", {
      outcome: "not_paid",
      token_len: rawToken.length,
      flow_status: fetched.data.status,
    });
    return { outcome: "not_paid" };
  }

  const commerceOrder = fetched.data.commerceOrder?.trim() ?? "";

  /** Flow commerceOrder may be `payments.id` (UUID, legacy) or `MES-*` refs (see payment_flow_checkout_refs). */
  const { payRow: matched, error: lookupErr, skipReason } = await lookupPaymentRowForFlowFinalize(
    admin,
    commerceOrder,
  );

  if (lookupErr || skipReason === "invalid_commerce_order" || !matched) {
    logResolve("reject", {
      outcome: "reconcile_error",
      branch: lookupErr ? "lookup_db" : skipReason ?? "no_matched_payment",
      commerce_prefix: commerceOrder.slice(0, 16),
    });
    return { outcome: "reconcile_error" };
  }

  const paymentId = matched.id;

  const { data: visible, error: visErr } = await input.supabase
    .from("payments")
    .select("id")
    .eq("id", paymentId)
    .maybeSingle();

  if (visErr || !visible) {
    logResolve("reject", {
      outcome: "unauthorized_payment",
      payment_id_prefix: paymentId.slice(0, 8),
    });
    return { outcome: "unauthorized_payment" };
  }

  const finalized = await finalizeMonthlyPaymentFromFlowGateway({
    admin,
    apiBaseUrl: base,
    apiKey: creds.apiKey,
    secretKey: creds.secretKey,
    token: rawToken,
    flowPaidSnapshot: fetched.data,
  });

  if (!finalized.ok) {
    logResolve("reject", { outcome: "reconcile_error", branch: "finalize_returned_false" });
    return { outcome: "reconcile_error" };
  }

  const { data: row } = await input.supabase
    .from("payments")
    .select("status, month, year")
    .eq("id", paymentId)
    .maybeSingle();

  if (row?.status === "approved" && row.month != null && row.year != null) {
    return {
      outcome: "success",
      month: Number(row.month),
      year: Number(row.year),
      paymentId,
    };
  }

  return { outcome: "processing" };
}
