import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Buffer } from "node:buffer";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeMonthlyPaymentFromFlowGateway } from "@/lib/billing/finalizeMonthlyPaymentFromFlowGateway";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { flowChileApiBase, loadFlowChileCredentialsPlain } from "@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain";
import { flowFetchPaymentStatus } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";

const FLOW_PAID = 2;

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type FlowMonthlyPaymentReturnPageModel =
  | { outcome: "no_token" }
  | { outcome: "misconfigured" }
  | { outcome: "status_failed" }
  | { outcome: "not_paid" }
  | { outcome: "unauthorized_payment" }
  | { outcome: "success"; month: number; year: number }
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
    return { outcome: "no_token" };
  }

  let rawKey: Buffer;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch {
    return { outcome: "misconfigured" };
  }

  const admin = createAdminClient();
  const creds = await loadFlowChileCredentialsPlain(admin, rawKey);
  if (!creds?.enabled) {
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
    return { outcome: "status_failed" };
  }

  if (fetched.data.status !== FLOW_PAID) {
    return { outcome: "not_paid" };
  }

  const commerceOrder = fetched.data.commerceOrder?.trim() ?? "";
  if (!uuidRe.test(commerceOrder)) {
    return { outcome: "reconcile_error" };
  }

  const { data: visible, error: visErr } = await input.supabase
    .from("payments")
    .select("id")
    .eq("id", commerceOrder)
    .maybeSingle();

  if (visErr || !visible) {
    return { outcome: "unauthorized_payment" };
  }

  const finalized = await finalizeMonthlyPaymentFromFlowGateway({
    admin,
    apiBaseUrl: base,
    apiKey: creds.apiKey,
    secretKey: creds.secretKey,
    token: rawToken,
  });

  if (!finalized.ok) {
    return { outcome: "reconcile_error" };
  }

  const { data: row } = await input.supabase
    .from("payments")
    .select("status, month, year")
    .eq("id", commerceOrder)
    .maybeSingle();

  if (row?.status === "approved" && row.month != null && row.year != null) {
    return {
      outcome: "success",
      month: Number(row.month),
      year: Number(row.year),
    };
  }

  return { outcome: "processing" };
}
