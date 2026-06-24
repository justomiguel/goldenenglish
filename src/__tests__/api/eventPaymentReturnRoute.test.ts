/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockReconcileMp = vi.fn();
const mockReconcileFlow = vi.fn();

vi.mock("@/lib/events/server/reconcileEventGatewayPaymentReturn", () => ({
  reconcileEventMercadoPagoReturn: (...args: unknown[]) => mockReconcileMp(...args),
  reconcileEventFlowReturn: (...args: unknown[]) => mockReconcileFlow(...args),
}));

vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: () => new URL("https://goldenenglish.cl"),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
}));

import { GET, POST } from "@/app/api/events/payment-return/route";

describe("/api/events/payment-return", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReconcileMp.mockResolvedValue("success");
    mockReconcileFlow.mockResolvedValue("success");
  });

  it("GET finalizes MercadoPago returns before redirecting", async () => {
    const res = await GET(
      new Request(
        "https://goldenenglish.cl/api/events/payment-return?locale=es&slug=gala&status=success&payment_id=123&external_reference=event_payment:pay-1&collection_status=approved",
      ),
    );

    expect(res.status).toBe(303);
    expect(mockReconcileMp).toHaveBeenCalledWith({
      mpPaymentId: "123",
      externalReference: "event_payment:pay-1",
      returnStatus: "approved",
    });
    expect(res.headers.get("location")).toBe(
      "https://goldenenglish.cl/es/events/gala?payment=success",
    );
  });

  it("POST finalizes Flow returns using the token body field", async () => {
    const res = await POST(
      new Request("https://goldenenglish.cl/api/events/payment-return?locale=es&slug=gala&status=pending", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: "flow-token" }).toString(),
      }),
    );

    expect(res.status).toBe(303);
    expect(mockReconcileFlow).toHaveBeenCalledWith({ token: "flow-token" });
    expect(res.headers.get("location")).toBe(
      "https://goldenenglish.cl/es/events/gala?payment=success",
    );
  });

  it("GET falls back to bridge status when gateway params are absent", async () => {
    mockReconcileMp.mockClear();

    const res = await GET(
      new Request("https://goldenenglish.cl/api/events/payment-return?locale=es&slug=gala&status=pending"),
    );

    expect(res.status).toBe(303);
    expect(mockReconcileMp).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe(
      "https://goldenenglish.cl/es/events/gala?payment=pending",
    );
  });

  it("POST falls back to bridge status when token is missing", async () => {
    mockReconcileFlow.mockClear();

    const res = await POST(
      new Request("https://goldenenglish.cl/api/events/payment-return?locale=es&slug=gala&status=failure", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({}).toString(),
      }),
    );

    expect(res.status).toBe(303);
    expect(mockReconcileFlow).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe(
      "https://goldenenglish.cl/es/events/gala?payment=failure",
    );
  });

  it("returns 502 when slug is missing", async () => {
    const res = await GET(
      new Request("https://goldenenglish.cl/api/events/payment-return?locale=es&status=success"),
    );

    expect(res.status).toBe(502);
  });
});
