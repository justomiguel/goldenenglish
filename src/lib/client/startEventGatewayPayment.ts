export interface StartEventGatewayPaymentInput {
  slug: string;
  attendeeId: string;
  method: "mercadopago" | "flow";
  email: string;
  dniOrPassport: string;
  locale: string;
}

export type StartEventGatewayPaymentResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; code: string };

export async function startEventGatewayPayment(
  input: StartEventGatewayPaymentInput,
): Promise<StartEventGatewayPaymentResult> {
  const response = await fetch(
    `/api/events/${encodeURIComponent(input.slug)}/payment/start`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attendeeId: input.attendeeId,
        method: input.method,
        email: input.email,
        dniOrPassport: input.dniOrPassport,
        locale: input.locale,
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; code?: string; redirectUrl?: string }
    | null;

  if (!response.ok || !payload?.ok || !payload.redirectUrl) {
    return { ok: false, code: payload?.code ?? "start_failed" };
  }

  return { ok: true, redirectUrl: payload.redirectUrl };
}
