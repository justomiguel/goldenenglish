import { signFlowParams } from "@/lib/payment-gateways/flow/flowParamSign";
import { parseFlowStatusResponseBody } from "@/lib/payment-gateways/flow/parseFlowStatusResponse";

export interface FlowStatusPayload {
  flowOrder: number;
  commerceOrder: string;
  status: number;
  amount: number;
  currency: string;
  payer?: string;
  /**
   * Flow `paymentData` subset — when present, `date` is the authoritative paid-at timestamp.
   * Fee / balance / transferDate enable admin financial reconciliation; conversion fields
   * are populated when the order was paid in a currency different from the merchant settlement currency.
   */
  paymentData?: {
    date?: string;
    media?: string;
    fee?: number;
    balance?: number;
    transferDate?: string;
    conversionRate?: number;
    conversionDate?: string;
  };
}

export type FlowFetchStatusResult =
  | { ok: true; data: FlowStatusPayload }
  | { ok: false; error: string };

export async function flowFetchPaymentStatus(input: {
  apiBaseUrl: string;
  apiKey: string;
  secretKey: string;
  token: string;
}): Promise<FlowFetchStatusResult> {
  const baseFields = {
    apiKey: input.apiKey,
    token: input.token,
  };
  const s = signFlowParams(baseFields, input.secretKey);
  const qs = new URLSearchParams({ ...baseFields, s });
  const res = await fetch(`${input.apiBaseUrl}/payment/getStatus?${qs.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const t = await res.text();
    return { ok: false, error: `flow_status_http_${res.status}:${t.slice(0, 200)}` };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, error: "flow_status_non_json_body" };
  }
  return parseFlowStatusResponseBody(json);
}
