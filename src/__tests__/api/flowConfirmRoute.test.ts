/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFinalizeMonthly = vi.fn();
const mockFinalizeEvent = vi.fn();
const mockLoadCreds = vi.fn();
const mockAdmin = vi.fn();

vi.mock("@/lib/billing/finalizeMonthlyPaymentFromFlowGateway", () => ({
  finalizeMonthlyPaymentFromFlowGateway: (...args: unknown[]) => mockFinalizeMonthly(...args),
}));

vi.mock("@/lib/events/server/finalizeEventPaymentFromFlowGateway", () => ({
  finalizeEventPaymentFromFlowGateway: (...args: unknown[]) => mockFinalizeEvent(...args),
}));

vi.mock("@/lib/payment-gateways/loadPaymentGatewayEncryptionKey", () => ({
  loadPaymentGatewayEncryptionKeyRaw32: () => Buffer.alloc(32),
}));

vi.mock("@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain", () => ({
  flowChileApiBase: () => "https://flow.test",
  loadFlowChileCredentialsPlain: (...args: unknown[]) => mockLoadCreds(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdmin(),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
}));

import { POST } from "@/app/api/payments/flow/confirm/route";

describe("POST /api/payments/flow/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdmin.mockReturnValue({});
    mockLoadCreds.mockResolvedValue({
      enabled: true,
      apiKey: "flow-api-key",
      secretKey: "flow-secret",
      environment: "sandbox",
    });
    mockFinalizeMonthly.mockResolvedValue({ ok: true });
    mockFinalizeEvent.mockResolvedValue({ ok: true });
  });

  it("routes to monthly finalizer by default", async () => {
    const res = await POST(
      new Request("https://example.com/api/payments/flow/confirm", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: "tok-monthly" }).toString(),
      }),
    );
    expect(res.status).toBe(200);
    expect(mockFinalizeMonthly).toHaveBeenCalled();
    expect(mockFinalizeEvent).not.toHaveBeenCalled();
  });

  it("routes to event finalizer when purpose=event", async () => {
    const res = await POST(
      new Request("https://example.com/api/payments/flow/confirm?purpose=event", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: "tok-event" }).toString(),
      }),
    );
    expect(res.status).toBe(200);
    expect(mockFinalizeEvent).toHaveBeenCalled();
    expect(mockFinalizeMonthly).not.toHaveBeenCalled();
  });
});
