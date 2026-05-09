import { signFlowParams } from "@/lib/payment-gateways/flow/flowParamSign";

export interface FlowStatusPayload {
  flowOrder: number;
  commerceOrder: string;
  status: number;
  amount: number;
  currency: string;
  payer?: string;
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

  const json = (await res.json()) as Partial<FlowStatusPayload>;
  if (
    typeof json.flowOrder !== "number" ||
    typeof json.commerceOrder !== "string" ||
    typeof json.status !== "number" ||
    typeof json.amount !== "number" ||
    typeof json.currency !== "string"
  ) {
    return { ok: false, error: "flow_invalid_status_response" };
  }
  return {
    ok: true,
    data: {
      flowOrder: json.flowOrder,
      commerceOrder: json.commerceOrder,
      status: json.status,
      amount: json.amount,
      currency: json.currency,
      payer: typeof json.payer === "string" ? json.payer : undefined,
    },
  };
}
