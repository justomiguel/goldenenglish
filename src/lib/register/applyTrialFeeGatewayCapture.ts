import type { SupabaseClient } from "@supabase/supabase-js";
import { amountsMatchForCurrency } from "@/lib/billing/upsertApprovedMonthlyPaymentSupport";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function applyTrialFeeGatewayCapture(input: {
  admin: SupabaseClient;
  registrationId: string;
  gatewayAmount: number;
  gatewayCurrency: string;
}): Promise<{ ok: true; skipped?: string } | { ok: false }> {
  const { data, error } = await input.admin
    .from("registrations")
    .select("id, intent, status, trial_fee_captured, trial_fee_snapshot")
    .eq("id", input.registrationId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("applyTrialFeeGatewayCapture:select", error, {
      registrationId: input.registrationId,
    });
    return { ok: false };
  }
  if (!data) return { ok: true, skipped: "not_found" };
  const row = data as Record<string, unknown>;
  if (String(row.intent ?? "") !== "trial") return { ok: true, skipped: "not_found" };
  if (String(row.status ?? "") === "enrolled") return { ok: true, skipped: "already_enrolled" };

  const snapshot = (row.trial_fee_snapshot ?? {}) as {
    kind?: unknown;
    total?: unknown;
    currency?: unknown;
  };
  const expected = Number(snapshot.total ?? 0);
  const currency = String(snapshot.currency ?? input.gatewayCurrency).toUpperCase();
  if (!(expected > 0) || !amountsMatchForCurrency(expected, input.gatewayAmount, currency)) {
    return { ok: true, skipped: "amount_mismatch" };
  }

  const paidSoFar = Number((snapshot as { paidTotal?: unknown }).paidTotal ?? 0) || 0;
  const nextSnapshot = {
    ...snapshot,
    kind: snapshot.kind === "trial_fee_delta" ? "trial_fee_delta" : "trial_fee",
    total: 0,
    paidTotal: paidSoFar + expected,
  };
  const { error: upErr } = await input.admin
    .from("registrations")
    .update({
      trial_fee_captured: true,
      trial_fee_snapshot: nextSnapshot,
    })
    .eq("id", input.registrationId);
  if (upErr) {
    logSupabaseClientError("applyTrialFeeGatewayCapture:update", upErr, {
      registrationId: input.registrationId,
    });
    return { ok: false };
  }
  return { ok: true };
}
