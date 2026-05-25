import type { MercadoPagoEnvironment } from "@/lib/payment-gateways/mercadopago/mercadoPagoApiBaseUrl";
import { MERCADOPAGO_API_BASE } from "@/lib/payment-gateways/mercadopago/mercadoPagoApiBaseUrl";

export type MercadoPagoCreatePreferenceInput = {
  accessToken: string;
  environment: MercadoPagoEnvironment;
  title: string;
  unitPrice: number;
  currencyId: string;
  externalReference: string;
  payerEmail: string;
  notificationUrl: string;
  backUrls: {
    success: string;
    failure: string;
    pending: string;
  };
};

export type MercadoPagoCreatePreferenceResult =
  | { ok: true; preferenceId: string; redirectUrl: string }
  | { ok: false; error: string; status?: number };

export async function mercadoPagoCreatePreference(
  input: MercadoPagoCreatePreferenceInput,
): Promise<MercadoPagoCreatePreferenceResult> {
  const body = {
    items: [
      {
        title: input.title,
        quantity: 1,
        unit_price: input.unitPrice,
        currency_id: input.currencyId,
      },
    ],
    payer: { email: input.payerEmail },
    back_urls: input.backUrls,
    auto_return: "approved",
    notification_url: input.notificationUrl,
    external_reference: input.externalReference,
  };

  const res = await fetch(`${MERCADOPAGO_API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: text.slice(0, 500), status: res.status };
  }

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "invalid_json" };
  }

  const preferenceId = String(json.id ?? "").trim();
  const initPoint =
    input.environment === "production"
      ? String(json.init_point ?? "").trim()
      : String(json.sandbox_init_point ?? json.init_point ?? "").trim();

  if (!preferenceId || !initPoint) {
    return { ok: false, error: "missing_init_point" };
  }

  return { ok: true, preferenceId, redirectUrl: initPoint };
}
