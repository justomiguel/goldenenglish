import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeMonthlyPaymentFromFlowGateway } from "@/lib/billing/finalizeMonthlyPaymentFromFlowGateway";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { loadFlowChileCredentialsPlain, flowChileApiBase } from "@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain";
import { logServerException } from "@/lib/logging/serverActionLog";

export async function POST(req: Request): Promise<Response> {
  try {
    const raw = await req.text();
    const params = new URLSearchParams(raw);
    const token = params.get("token")?.trim() ?? "";
    if (!token) {
      return new Response("missing_token", { status: 200 });
    }

    let rawKey;
    try {
      rawKey = loadPaymentGatewayEncryptionKeyRaw32();
    } catch (e) {
      logServerException("flowConfirm:encryptionKey", e);
      return new Response("ok", { status: 200 });
    }

    const admin = createAdminClient();
    const creds = await loadFlowChileCredentialsPlain(admin, rawKey);
    if (!creds?.enabled) {
      return new Response("ok", { status: 200 });
    }

    const base = flowChileApiBase(creds);
    const result = await finalizeMonthlyPaymentFromFlowGateway({
      admin,
      apiBaseUrl: base,
      apiKey: creds.apiKey,
      secretKey: creds.secretKey,
      token,
    });

    if (!result.ok) {
      logServerException("flowConfirm:finalize_failed", new Error("finalize_failed"));
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    logServerException("flowConfirm", e);
    return new Response("ok", { status: 200 });
  }
}
