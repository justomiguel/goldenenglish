import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { signFlowParams } from "@/lib/payment-gateways/flow/flowParamSign";

describe("signFlowParams", () => {
  it("sorts keys lexicographically and concatenates name+value", () => {
    const params = { zed: "9", apple: "2", beta: "3" };
    const secret = "test-secret";
    const signed = signFlowParams(params, secret);
    const manual = createHmac("sha256", secret).update("apple2beta3zed9").digest("hex");
    expect(signed).toBe(manual);
  });

  it("ignores the signature key s in the input map", () => {
    const params = { b: "2", s: "must-ignore", a: "1" };
    const secret = "x";
    const signed = signFlowParams(params, secret);
    const manual = createHmac("sha256", secret).update("a1b2").digest("hex");
    expect(signed).toBe(manual);
  });
});
