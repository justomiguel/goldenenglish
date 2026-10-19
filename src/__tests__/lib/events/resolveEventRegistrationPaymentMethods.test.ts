import { describe, expect, it } from "vitest";
import {
  isEventRegistrationPaymentMethod,
  payableEventOnlineGateways,
  resolveEventRegistrationPaymentMethods,
} from "@/lib/events/resolveEventRegistrationPaymentMethods";

describe("resolveEventRegistrationPaymentMethods", () => {
  it("returns only enabled online gateways when bank transfer is off", () => {
    expect(
      resolveEventRegistrationPaymentMethods({
        enabledGateways: ["mercadopago"],
        bankTransferEnabled: false,
      }),
    ).toEqual(["mercadopago"]);
  });

  it("appends transfer when bank transfer is enabled", () => {
    expect(
      resolveEventRegistrationPaymentMethods({
        enabledGateways: ["flow"],
        bankTransferEnabled: true,
      }),
    ).toEqual(["flow", "transfer"]);
  });

  it("allows transfer-only when no gateways are configured", () => {
    expect(
      resolveEventRegistrationPaymentMethods({
        enabledGateways: [],
        bankTransferEnabled: true,
      }),
    ).toEqual(["transfer"]);
  });
});

describe("payableEventOnlineGateways", () => {
  it("omits Mercado Pago when that gateway is disabled", () => {
    expect(
      payableEventOnlineGateways({ flowEnabled: true, mercadoPagoEnabled: false }),
    ).toEqual(["flow"]);
  });

  it("omits both online gateways when neither is enabled", () => {
    expect(
      payableEventOnlineGateways({ flowEnabled: false, mercadoPagoEnabled: false }),
    ).toEqual([]);
  });

  it("keeps Mercado Pago only when its credentials are enabled", () => {
    expect(
      payableEventOnlineGateways({ flowEnabled: false, mercadoPagoEnabled: true }),
    ).toEqual(["mercadopago"]);
  });
});

describe("isEventRegistrationPaymentMethod", () => {
  it("validates against the allowed list", () => {
    const allowed = ["flow"] as const;
    expect(isEventRegistrationPaymentMethod("flow", allowed)).toBe(true);
    expect(isEventRegistrationPaymentMethod("mercadopago", allowed)).toBe(false);
  });
});
