import type { PaymentGatewayProvider } from "@/types/paymentGateway";

export type RegistrationPublicPayMethod = PaymentGatewayProvider | "transfer";

export function resolveRegistrationPublicPayMethods(input: {
  enabledGateways: PaymentGatewayProvider[];
  transferInstructions: string | null | undefined;
}): RegistrationPublicPayMethod[] {
  const methods: RegistrationPublicPayMethod[] = [...input.enabledGateways];
  if ((input.transferInstructions ?? "").trim().length > 0) {
    methods.push("transfer");
  }
  return methods;
}
