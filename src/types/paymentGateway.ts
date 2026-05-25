export type PaymentGatewayProvider = "flow" | "mercadopago";

export type PaymentGatewayCountryCode = "CL" | "AR";

export type EnabledPaymentGateway = {
  provider: PaymentGatewayProvider;
};
