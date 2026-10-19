import type { PaymentGatewayProvider } from "@/types/paymentGateway";

export type EventRegistrationPaymentMethod = PaymentGatewayProvider | "transfer";

export function resolveEventRegistrationPaymentMethods(input: {
  enabledGateways: PaymentGatewayProvider[];
  bankTransferEnabled: boolean;
}): EventRegistrationPaymentMethod[] {
  const methods: EventRegistrationPaymentMethod[] = [...input.enabledGateways];
  if (input.bankTransferEnabled) {
    methods.push("transfer");
  }
  return methods;
}

/** Drops online gateways the checkout would refuse because credentials are off. */
export function payableEventOnlineGateways(input: {
  flowEnabled: boolean;
  mercadoPagoEnabled: boolean;
}): PaymentGatewayProvider[] {
  const gateways: PaymentGatewayProvider[] = [];
  if (input.flowEnabled) gateways.push("flow");
  if (input.mercadoPagoEnabled) gateways.push("mercadopago");
  return gateways;
}

export function isEventRegistrationPaymentMethod(
  value: string,
  allowed: readonly EventRegistrationPaymentMethod[],
): value is EventRegistrationPaymentMethod {
  return allowed.includes(value as EventRegistrationPaymentMethod);
}
