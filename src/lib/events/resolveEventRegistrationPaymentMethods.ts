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

export function isEventRegistrationPaymentMethod(
  value: string,
  allowed: readonly EventRegistrationPaymentMethod[],
): value is EventRegistrationPaymentMethod {
  return allowed.includes(value as EventRegistrationPaymentMethod);
}
