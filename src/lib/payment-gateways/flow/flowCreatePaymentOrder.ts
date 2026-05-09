import { signFlowParams } from "@/lib/payment-gateways/flow/flowParamSign";
import { stringifyFlowParamValue } from "@/lib/payment-gateways/flow/stringifyFlowParamValue";

export interface FlowCreateOrderInput {
  apiBaseUrl: string;
  apiKey: string;
  secretKey: string;
  commerceOrder: string;
  subject: string;
  currency: string;
  amount: number;
  email: string;
  urlConfirmation: string;
  urlReturn: string;
  optionalJson?: Record<string, string>;
}

export type FlowCreateOrderResult =
  | { ok: true; url: string; token: string; flowOrder: number }
  | { ok: false; error: string };

export async function flowCreatePaymentOrder(input: FlowCreateOrderInput): Promise<FlowCreateOrderResult> {
  const fields: Record<string, string> = {
    apiKey: input.apiKey,
    commerceOrder: input.commerceOrder,
    subject: input.subject,
    currency: input.currency,
    amount: stringifyFlowParamValue(input.amount),
    email: input.email,
    urlConfirmation: input.urlConfirmation,
    urlReturn: input.urlReturn,
  };
  if (input.optionalJson && Object.keys(input.optionalJson).length > 0) {
    fields.optional = JSON.stringify(input.optionalJson);
  }

  const signature = signFlowParams(fields, input.secretKey);
  fields.s = signature;

  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) {
    body.set(k, v);
  }

  const res = await fetch(`${input.apiBaseUrl}/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const t = await res.text();
    return { ok: false, error: `flow_http_${res.status}:${t.slice(0, 200)}` };
  }

  const json = (await res.json()) as {
    url?: string;
    token?: string;
    flowOrder?: number;
  };
  if (!json.url || !json.token || typeof json.flowOrder !== "number") {
    return { ok: false, error: "flow_invalid_create_response" };
  }
  return { ok: true, url: json.url, token: json.token, flowOrder: json.flowOrder };
}
