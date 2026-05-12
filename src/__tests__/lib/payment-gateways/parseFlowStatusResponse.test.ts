import { describe, expect, it } from "vitest";
import { parseFlowStatusResponseBody } from "@/lib/payment-gateways/flow/parseFlowStatusResponse";

describe("parseFlowStatusResponseBody", () => {
  it("accepts canonical numeric Flow getStatus payload", () => {
    const r = parseFlowStatusResponseBody({
      flowOrder: 12345,
      commerceOrder: "MES-2026-05-00000001",
      status: 2,
      amount: 350,
      currency: "CLP",
      payer: "x@example.com",
    });
    expect(r).toEqual({
      ok: true,
      data: {
        flowOrder: 12345,
        commerceOrder: "MES-2026-05-00000001",
        status: 2,
        amount: 350,
        currency: "CLP",
        payer: "x@example.com",
      },
    });
  });

  it("tolerates Flow returning amount/flowOrder/status as numeric strings", () => {
    const r = parseFlowStatusResponseBody({
      flowOrder: "98765",
      commerceOrder: "abc",
      status: "2",
      amount: "350",
      currency: "CLP",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.flowOrder).toBe(98765);
      expect(r.data.status).toBe(2);
      expect(r.data.amount).toBe(350);
    }
  });

  it("surfaces Flow error envelope distinctly so logs identify token/credential issues", () => {
    const r = parseFlowStatusResponseBody({ code: 1018, message: "Token is not valid" });
    expect(r).toEqual({ ok: false, error: "flow_status_error_code_1018" });
  });

  it("lists missing keys when shape is incomplete", () => {
    const r = parseFlowStatusResponseBody({ flowOrder: 1, commerceOrder: "x", status: 2 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain("flow_invalid_status_response:missing=");
      expect(r.error).toContain("amount");
      expect(r.error).toContain("currency");
    }
  });

  it("extracts paymentData fields including fee, balance, transferDate, conversion rate/date", () => {
    const r = parseFlowStatusResponseBody({
      flowOrder: 1,
      commerceOrder: "x",
      status: 2,
      amount: 1,
      currency: "CLP",
      paymentData: {
        date: "2026-05-10 21:00:00",
        media: "Webpay",
        fee: 30,
        balance: 320,
        transferDate: "2026-05-12 00:00:00",
        conversionRate: 1,
        conversionDate: "2026-05-10 20:55:00",
      },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.paymentData).toEqual({
        date: "2026-05-10 21:00:00",
        media: "Webpay",
        fee: 30,
        balance: 320,
        transferDate: "2026-05-12 00:00:00",
        conversionRate: 1,
        conversionDate: "2026-05-10 20:55:00",
      });
    }
  });

  it("coerces numeric strings on fee, balance, conversionRate (Flow sometimes returns them as strings)", () => {
    const r = parseFlowStatusResponseBody({
      flowOrder: 1,
      commerceOrder: "x",
      status: 2,
      amount: 1,
      currency: "CLP",
      paymentData: { fee: "30", balance: "320", conversionRate: "1.000" },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.paymentData).toMatchObject({ fee: 30, balance: 320, conversionRate: 1 });
    }
  });

  it("omits paymentData when Flow does not return date or media", () => {
    const r = parseFlowStatusResponseBody({
      flowOrder: 1,
      commerceOrder: "x",
      status: 2,
      amount: 1,
      currency: "CLP",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.paymentData).toBeUndefined();
    }
  });

  it("rejects non-object bodies", () => {
    expect(parseFlowStatusResponseBody(null)).toEqual({
      ok: false,
      error: "flow_invalid_status_response:not_object",
    });
    expect(parseFlowStatusResponseBody("oops")).toEqual({
      ok: false,
      error: "flow_invalid_status_response:not_object",
    });
  });
});
