import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const mockRecordSystemAudit = vi.fn();
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (p: unknown) => mockRecordSystemAudit(p),
}));

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (path: string, layout?: unknown) =>
    mockRevalidatePath(path, layout),
}));

/** REGRESSION CHECK: deleting Flow Chile credentials triggers audit + revalidate finance layout; RLS enforced by prod DB. */

const innerEqCountry = vi.fn();
const outerEqProvider = vi.fn();

const mockPaymentTable = () => ({
  delete: () => ({
    eq: (col: string, val: unknown) => {
      outerEqProvider(col, val);
      return { eq: innerEqCountry };
    },
  }),
});

const mockCreateClient = vi.fn();
mockCreateClient.mockImplementation(() => ({
  from: (table: string) => {
    if (table !== "payment_gateway_credentials") {
      throw new Error(`unexpected table ${table}`);
    }
    return mockPaymentTable();
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerAuthzDenied: vi.fn(),
  logServerActionException: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

import { deleteFlowChileGatewayCredentials } from "@/app/[locale]/dashboard/admin/finance/flowGatewaySettingsActions";

describe("deleteFlowChileGatewayCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    innerEqCountry.mockResolvedValue({ error: null });
  });

  it("returns unauthorized when assertAdmin fails", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));

    const result = await deleteFlowChileGatewayCredentials({ locale: "es" });

    expect(result).toEqual({ ok: false, error: "unauthorized" });
  });

  it("returns invalid for bad payload", async () => {
    mockAssertAdmin.mockResolvedValue(undefined);

    const result = await deleteFlowChileGatewayCredentials({ locale: "x" });

    expect(result).toEqual({ ok: false, error: "invalid" });
  });

  it("returns db when Supabase delete reports error", async () => {
    mockAssertAdmin.mockResolvedValue(undefined);
    innerEqCountry.mockResolvedValueOnce({ error: { message: "db down" } });

    const result = await deleteFlowChileGatewayCredentials({ locale: "es" });

    expect(result).toEqual({ ok: false, error: "db" });
  });

  it("deletes flow_CL, records audit, and revalidates finance layout", async () => {
    mockAssertAdmin.mockResolvedValue(undefined);

    const result = await deleteFlowChileGatewayCredentials({ locale: "en" });

    expect(result).toEqual({ ok: true });

    expect(outerEqProvider).toHaveBeenCalledWith("provider", "flow");
    expect(innerEqCountry).toHaveBeenCalledWith("country_code", "CL");

    expect(mockRecordSystemAudit).toHaveBeenCalledWith({
      action: "payment_gateway_flow_cl_delete",
      resourceType: "payment_gateway_credentials",
      resourceId: "flow_CL",
      payload: {},
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/dashboard/admin/finance", "layout");
  });
});
