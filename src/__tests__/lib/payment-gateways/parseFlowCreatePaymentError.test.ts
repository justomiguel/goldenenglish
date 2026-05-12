import { describe, expect, it } from "vitest";
import {
  extractFlowMinimumClpFromCreateError,
  isFlowAmountBelowMinimumError,
} from "@/lib/payment-gateways/flow/parseFlowCreatePaymentError";

describe("parseFlowCreatePaymentError", () => {
  it("parses Flow 1901 minimum CLP from create error string", () => {
    const err =
      'flow_http_400:{"code":1901,"message":"The minimum amount is 350 CLP"}';
    expect(extractFlowMinimumClpFromCreateError(err)).toBe(350);
    expect(isFlowAmountBelowMinimumError(err)).toBe(true);
  });

  it("returns null when not a minimum CLP payload", () => {
    expect(extractFlowMinimumClpFromCreateError("flow_http_500:oops")).toBe(null);
    expect(isFlowAmountBelowMinimumError("flow_invalid")).toBe(false);
  });
});
