import { describe, expect, it } from "vitest";
import { canDeleteEventAttendee } from "@/lib/events/canDeleteEventAttendee";

describe("canDeleteEventAttendee", () => {
  it("allows delete when there is no payment", () => {
    expect(canDeleteEventAttendee(null)).toBe(true);
  });

  it("allows delete for an approved Mercado Pago or Flow payment", () => {
    expect(
      canDeleteEventAttendee({
        status: "approved",
        amount: 1000,
        currency: "CLP",
        gatewayProvider: "mercadopago",
      }),
    ).toBe(true);
    expect(
      canDeleteEventAttendee({
        status: "pending",
        amount: 1000,
        currency: "CLP",
        gatewayProvider: "flow",
      }),
    ).toBe(true);
  });
});
