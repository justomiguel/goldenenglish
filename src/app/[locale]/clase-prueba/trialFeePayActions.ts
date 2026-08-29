"use server";

import { redirect } from "next/navigation";
import { Buffer } from "node:buffer";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { loadTrialPayLeadByToken, requestedIdsFromTrialPayLead } from "@/lib/register/loadTrialPayLead";
import { planTrialFeePayGate } from "@/lib/register/planTrialFeePayGate";
import { requestedSectionsHaveOpenSeats } from "@/lib/register/requestedSectionsHaveOpenSeats";
import { startTrialLeadGatewayCore } from "@/lib/register/startTrialLeadGatewayCore";

export type TrialFeePayActionResult = { ok: true } | { ok: false; code: string };

async function startTrialFeeGateway(
  locale: string,
  token: string,
  method: "flow" | "mercadopago",
): Promise<TrialFeePayActionResult> {
  let rawKey: Buffer;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch {
    return { ok: false, code: "method_unavailable" };
  }
  const admin = createAdminClient();
  const lead = await loadTrialPayLeadByToken(admin, token);
  if (!lead) return { ok: false, code: "not_found" };
  const open = await requestedSectionsHaveOpenSeats(
    admin,
    requestedIdsFromTrialPayLead(lead),
  );
  const gate = planTrialFeePayGate({
    intent: lead.intent,
    status: lead.status,
    trialFeeCaptured: lead.trialFeeCaptured,
    snapshotKind: lead.snapshotKind,
    snapshotTotal: lead.snapshotTotal,
    seatsHaveCupo: open,
  });
  if (!gate.ok) return { ok: false, code: gate.code };
  const result = await startTrialLeadGatewayCore({
    admin,
    encryptionKey32: rawKey,
    method,
    locale,
    purpose: "trial",
    registrationId: lead.id,
    amount: lead.snapshotTotal,
    currency: lead.snapshotCurrency,
    title: `Clase de prueba ${lead.firstName} ${lead.lastName}`.trim(),
    payerEmail: lead.familyEmail ?? "",
    returnPath: `/${locale}/clase-prueba/${token}`,
  });
  if (result.ok) redirect(result.redirectUrl);
  return result;
}

export async function startTrialFeeFlowAction(
  locale: string,
  token: string,
): Promise<TrialFeePayActionResult> {
  return startTrialFeeGateway(locale, token, "flow");
}

export async function startTrialFeeMercadoPagoAction(
  locale: string,
  token: string,
): Promise<TrialFeePayActionResult> {
  return startTrialFeeGateway(locale, token, "mercadopago");
}
