/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { resolveRegistrationPublicPayMethods } from "@/lib/register/resolveRegistrationPublicPayMethods";

describe("resolveRegistrationPublicPayMethods", () => {
  it("returns only enabled online gateways when transfer instructions are empty", () => {
    expect(
      resolveRegistrationPublicPayMethods({
        enabledGateways: ["flow", "mercadopago"],
        transferInstructions: null,
      }),
    ).toEqual(["flow", "mercadopago"]);
  });

  it("appends transfer when instructions are present", () => {
    expect(
      resolveRegistrationPublicPayMethods({
        enabledGateways: ["flow"],
        transferInstructions: "Banco Estado · 123",
      }),
    ).toEqual(["flow", "transfer"]);
  });

  it("allows transfer-only when no gateway is configured", () => {
    expect(
      resolveRegistrationPublicPayMethods({
        enabledGateways: [],
        transferInstructions: "CBU 000",
      }),
    ).toEqual(["transfer"]);
  });

  it("returns an empty list when nothing is configured", () => {
    expect(
      resolveRegistrationPublicPayMethods({
        enabledGateways: [],
        transferInstructions: "   ",
      }),
    ).toEqual([]);
  });
});
