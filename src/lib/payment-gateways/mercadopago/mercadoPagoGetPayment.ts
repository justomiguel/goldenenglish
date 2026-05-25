import { MERCADOPAGO_API_BASE } from "@/lib/payment-gateways/mercadopago/mercadoPagoApiBaseUrl";

export type MercadoPagoPaymentPayload = {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  currency_id: string;
  external_reference: string | null;
  date_approved: string | null;
  payment_method_id: string | null;
  payer?: { email?: string | null };
};

export type MercadoPagoGetPaymentResult =
  | { ok: true; data: MercadoPagoPaymentPayload }
  | { ok: false; error: string; status?: number };

export async function mercadoPagoGetPayment(input: {
  accessToken: string;
  paymentId: string | number;
}): Promise<MercadoPagoGetPaymentResult> {
  const id = encodeURIComponent(String(input.paymentId));
  const res = await fetch(`${MERCADOPAGO_API_BASE}/v1/payments/${id}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${input.accessToken}` },
  });

  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: text.slice(0, 500), status: res.status };
  }

  try {
    const json = JSON.parse(text) as MercadoPagoPaymentPayload;
    return { ok: true, data: json };
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}
