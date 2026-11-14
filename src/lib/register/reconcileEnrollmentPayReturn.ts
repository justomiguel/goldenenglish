import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { loadMercadoPagoCredentialsPlain } from "@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain";
import {
  flowChileApiBase,
  loadFlowChileCredentialsPlain,
} from "@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain";
import { logServerActionException } from "@/lib/logging/serverActionLog";
import { finalizeEnrollmentPaymentFromFlowGateway } from "@/lib/register/finalizeEnrollmentPaymentFromFlowGateway";
import { finalizeEnrollmentPaymentFromMercadoPago } from "@/lib/register/finalizeEnrollmentPaymentFromMercadoPago";
import { enrollmentPayReturnResult } from "@/lib/register/enrollmentPayReturnResult";
import type { PaymentGatewayCountryCode } from "@/types/paymentGateway";

function countryCode(raw: string): PaymentGatewayCountryCode {
  return raw.trim().toUpperCase() === "AR" ? "AR" : "CL";
}

export async function reconcileEnrollmentPayReturn(input: {
  admin: SupabaseClient;
  flowToken?: string;
  mpPaymentId?: string;
  returnStatus?: string;
  country?: string;
}): Promise<string> {
  const flowToken = input.flowToken?.trim() ?? "";
  const mpPaymentId = input.mpPaymentId?.trim() ?? "";
  try {
    if (flowToken) {
      const rawKey = await loadPaymentGatewayEncryptionKeyRaw32();
      const creds = await loadFlowChileCredentialsPlain(input.admin, rawKey);
      if (!creds?.enabled) return "method_unavailable";
      const result = await finalizeEnrollmentPaymentFromFlowGateway({
        admin: input.admin,
        apiBaseUrl: flowChileApiBase(creds),
        apiKey: creds.apiKey,
        secretKey: creds.secretKey,
        token: flowToken,
      });
      return enrollmentPayReturnResult({
        called: true,
        ok: result.ok,
        skipped: result.skipped,
        returnStatus: input.returnStatus,
      });
    }
    if (mpPaymentId) {
      const rawKey = await loadPaymentGatewayEncryptionKeyRaw32();
      const creds = await loadMercadoPagoCredentialsPlain(
        input.admin,
        rawKey,
        countryCode(input.country ?? ""),
      );
      if (!creds?.enabled) return "method_unavailable";
      const result = await finalizeEnrollmentPaymentFromMercadoPago({
        admin: input.admin,
        accessToken: creds.accessToken,
        mpPaymentId,
      });
      return enrollmentPayReturnResult({
        called: true,
        ok: result.ok,
        skipped: result.skipped,
        returnStatus: input.returnStatus,
      });
    }
  } catch (error) {
    await logServerActionException("reconcileEnrollmentPayReturn", error);
    return "error";
  }
  return enrollmentPayReturnResult({
    called: false,
    returnStatus: input.returnStatus,
  });
}
