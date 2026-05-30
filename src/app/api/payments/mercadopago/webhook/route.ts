import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeMercadoPagoPayment } from "@/lib/billing/finalizeMercadoPagoPayment";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { loadMercadoPagoCredentialsPlain } from "@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain";
import { mercadoPagoVerifyWebhookSignature } from "@/lib/payment-gateways/mercadopago/mercadoPagoVerifyWebhookSignature";
import { logServerException, logServerWarn } from "@/lib/logging/serverActionLog";
import type { PaymentGatewayCountryCode } from "@/types/paymentGateway";
import { finalizeEventPaymentFromMercadoPago } from "@/lib/events/server/finalizeEventPaymentFromMercadoPago";

function parseCountry(raw: string | null): PaymentGatewayCountryCode | null {
  const c = raw?.trim().toUpperCase();
  if (c === "CL" || c === "AR") return c;
  return null;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const country = parseCountry(url.searchParams.get("country"));
    const purpose = url.searchParams.get("purpose")?.trim() ?? "monthly";
    if (!country) {
      logServerWarn("mpWebhook:missing_country", {});
      return new Response("ok", { status: 200 });
    }

    const dataId =
      url.searchParams.get("data.id") ??
      url.searchParams.get("id") ??
      "";

    let bodyJson: Record<string, unknown> = {};
    const rawBody = await req.text();
    if (rawBody.trim()) {
      try {
        bodyJson = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        /* MP may send empty body on some notifications */
      }
    }

    const bodyType = typeof bodyJson.type === "string" ? bodyJson.type : "";
    const bodyAction = typeof bodyJson.action === "string" ? bodyJson.action : "";
    if (bodyType && bodyType !== "payment" && !bodyAction.startsWith("payment.")) {
      return new Response("ok", { status: 200 });
    }

    const bodyData = bodyJson.data as Record<string, unknown> | undefined;
    const paymentIdFromBody = bodyData?.id != null ? String(bodyData.id) : "";
    const resolvedDataId = (dataId || paymentIdFromBody).trim();
    if (!resolvedDataId) {
      return new Response("ok", { status: 200 });
    }

    let rawKey;
    try {
      rawKey = loadPaymentGatewayEncryptionKeyRaw32();
    } catch (e) {
      logServerException("mpWebhook:encryptionKey", e);
      return new Response("ok", { status: 200 });
    }

    const admin = createAdminClient();
    const creds = await loadMercadoPagoCredentialsPlain(admin, rawKey, country);
    if (!creds?.enabled) {
      return new Response("ok", { status: 200 });
    }

    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");
    const valid = mercadoPagoVerifyWebhookSignature({
      webhookSecret: creds.webhookSecret,
      xSignature,
      xRequestId,
      dataId: resolvedDataId,
    });
    if (!valid) {
      logServerWarn("mpWebhook:invalid_signature", {
        country,
        data_id_prefix: resolvedDataId.slice(0, 8),
      });
      return new Response("unauthorized", { status: 401 });
    }

    const result =
      purpose === "event"
        ? await finalizeEventPaymentFromMercadoPago({
            admin,
            accessToken: creds.accessToken,
            mpPaymentId: resolvedDataId,
          })
        : await finalizeMercadoPagoPayment({
            admin,
            accessToken: creds.accessToken,
            mpPaymentId: resolvedDataId,
          });

    if (!result.ok) {
      logServerException("mpWebhook:finalize_failed", new Error("finalize_failed"));
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    logServerException("mpWebhook", e);
    return new Response("ok", { status: 200 });
  }
}
