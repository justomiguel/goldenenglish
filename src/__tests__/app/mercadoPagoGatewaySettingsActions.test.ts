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
  revalidatePath: (path: string, layout?: unknown) => mockRevalidatePath(path, layout),
}));

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

import { deleteMercadoPagoGatewayCredentials } from "@/app/[locale]/dashboard/admin/finance/mercadoPagoGatewaySettingsActions";

describe("deleteMercadoPagoGatewayCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    innerEqCountry.mockResolvedValue({ error: null });
  });

  it("returns unauthorized when assertAdmin fails", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));

    const result = await deleteMercadoPagoGatewayCredentials({
      locale: "es",
      countryCode: "CL",
    });

    expect(result).toEqual({ ok: false, error: "unauthorized" });
  });

  it("returns invalid for bad payload", async () => {
    mockAssertAdmin.mockResolvedValue(undefined);

    const result = await deleteMercadoPagoGatewayCredentials({ locale: "x" });

    expect(result).toEqual({ ok: false, error: "invalid" });
  });

  it("deletes mercadopago row, records audit, and revalidates finance layout", async () => {
    mockAssertAdmin.mockResolvedValue(undefined);

    const result = await deleteMercadoPagoGatewayCredentials({
      locale: "en",
      countryCode: "AR",
    });

    expect(result).toEqual({ ok: true });
    expect(outerEqProvider).toHaveBeenCalledWith("provider", "mercadopago");
    expect(innerEqCountry).toHaveBeenCalledWith("country_code", "AR");
    expect(mockRecordSystemAudit).toHaveBeenCalledWith({
      action: "payment_gateway_mercadopago_delete",
      resourceType: "payment_gateway_credentials",
      resourceId: "mercadopago_AR",
      payload: { country_code: "AR" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/en/dashboard/admin/finance", "layout");
  });
});
