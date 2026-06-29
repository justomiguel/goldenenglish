/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockValidateSlot = vi.fn();
const mockLoadCreds = vi.fn();
const mockCreateOrder = vi.fn();
const mockReserveSlot = vi.fn();
const mockExtractMin = vi.fn();
const mockLogInvariant = vi.fn();

vi.mock("@/lib/billing/validateStudentSectionMonthlySlot", () => ({
  validateStudentSectionMonthlySlot: (...a: unknown[]) => mockValidateSlot(...a),
}));
vi.mock("@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain", () => ({
  loadFlowChileCredentialsPlain: (...a: unknown[]) => mockLoadCreds(...a),
  flowChileApiBase: () => "https://flow.test/api",
}));
vi.mock("@/lib/payment-gateways/flow/flowCreatePaymentOrder", () => ({
  flowCreatePaymentOrder: (...a: unknown[]) => mockCreateOrder(...a),
}));
vi.mock("@/lib/payment-gateways/flow/parseFlowCreatePaymentError", () => ({
  extractFlowMinimumClpFromCreateError: (...a: unknown[]) => mockExtractMin(...a),
}));
vi.mock("@/lib/payment-gateways/flow/reservePaymentFlowCommerceReference", () => ({
  reservePaymentFlowCommerceReferenceForSlot: (...a: unknown[]) => mockReserveSlot(...a),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerActionInvariantViolation: (...a: unknown[]) => mockLogInvariant(...a),
}));
vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: () => new URL("https://test.example.com"),
}));
vi.mock("@/lib/billing/truncateFlowText", () => ({
  truncateForFlowText: (s: string) => s,
}));

import { startFlowMonthlyPaymentCore } from "@/lib/billing/startFlowMonthlyPaymentCore";
import { Buffer } from "node:buffer";

const STUDENT_ID = "11111111-1111-4111-8111-111111111111";
const SECTION_ID = "22222222-2222-4222-8222-222222222222";
const PARENT_ID = "33333333-3333-4333-8333-333333333333";

// Deferred creation: start no longer reads/writes a `payments` row.
const mockAdmin = { from: vi.fn() };

const baseInput = {
  supabase: {} as never,
  admin: mockAdmin as never,
  encryptionKey32: Buffer.alloc(32),
  studentId: STUDENT_ID,
  sectionId: SECTION_ID,
  month: 6,
  year: 2026,
  fallbackAmount: 50000,
  payerEmail: "payer@test.com",
  locale: "es",
  subject: "Cuota Junio 2026",
  paymentsDashboard: "student" as const,
  tutorParentId: null,
  studentLabelForFlow: "Doe John",
  sectionLabelForFlow: "Section A",
  periodLabelForFlow: "Junio 2026",
};

describe("startFlowMonthlyPaymentCore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExtractMin.mockReturnValue(null);
  });

  it("returns slot error when slot validation fails", async () => {
    mockValidateSlot.mockResolvedValue({ ok: false, reason: "forbidden" });
    const result = await startFlowMonthlyPaymentCore(baseInput);
    expect(result).toEqual({ ok: false, code: "slot", slotReason: "forbidden" });
    expect(mockLoadCreds).not.toHaveBeenCalled();
  });

  it("returns no_credentials when Flow is disabled", async () => {
    mockValidateSlot.mockResolvedValue({ ok: true, effectiveAmount: 50000, currency: "CLP" });
    mockLoadCreds.mockResolvedValue({ enabled: false });
    const result = await startFlowMonthlyPaymentCore(baseInput);
    expect(result).toEqual({ ok: false, code: "no_credentials" });
  });

  it("returns clp_only when the plan currency is not CLP", async () => {
    mockValidateSlot.mockResolvedValue({ ok: true, effectiveAmount: 50000, currency: "ARS" });
    mockLoadCreds.mockResolvedValue({ enabled: true, apiKey: "k", secretKey: "s" });
    const result = await startFlowMonthlyPaymentCore(baseInput);
    expect(result).toEqual({ ok: false, code: "clp_only" });
  });

  it("returns flow_error when reserving the commerce reference fails", async () => {
    mockValidateSlot.mockResolvedValue({ ok: true, effectiveAmount: 50000, currency: "CLP" });
    mockLoadCreds.mockResolvedValue({ enabled: true, apiKey: "k", secretKey: "s" });
    mockReserveSlot.mockResolvedValue({ ok: false });
    const result = await startFlowMonthlyPaymentCore(baseInput);
    expect(result).toEqual({ ok: false, code: "flow_error" });
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  it("returns redirectUrl on success and reserves the slot reference (no row created)", async () => {
    mockValidateSlot.mockResolvedValue({ ok: true, effectiveAmount: 50000, currency: "CLP" });
    mockLoadCreds.mockResolvedValue({ enabled: true, apiKey: "k", secretKey: "s" });
    mockReserveSlot.mockResolvedValue({ ok: true, commerceRef: "flow-ref-1" });
    mockCreateOrder.mockResolvedValue({
      ok: true,
      url: "https://flow.cl/pay",
      token: "tok-123",
    });

    const result = await startFlowMonthlyPaymentCore(baseInput);
    expect(result).toEqual({
      ok: true,
      redirectUrl: "https://flow.cl/pay?token=tok-123",
    });
    expect(mockReserveSlot).toHaveBeenCalledWith(mockAdmin, {
      studentId: STUDENT_ID,
      sectionId: SECTION_ID,
      year: 2026,
      month: 6,
      parentId: null,
    });
    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({ commerceOrder: "flow-ref-1", amount: 50000, currency: "CLP" }),
    );
    // No `payments` row is touched during start.
    expect(mockAdmin.from).not.toHaveBeenCalled();
  });

  it("passes the tutor parent id when reserving the slot reference", async () => {
    mockValidateSlot.mockResolvedValue({ ok: true, effectiveAmount: 50000, currency: "CLP" });
    mockLoadCreds.mockResolvedValue({ enabled: true, apiKey: "k", secretKey: "s" });
    mockReserveSlot.mockResolvedValue({ ok: true, commerceRef: "flow-ref-1" });
    mockCreateOrder.mockResolvedValue({ ok: true, url: "https://flow.cl/pay", token: "t" });

    await startFlowMonthlyPaymentCore({ ...baseInput, tutorParentId: PARENT_ID });
    expect(mockReserveSlot).toHaveBeenCalledWith(
      mockAdmin,
      expect.objectContaining({ parentId: PARENT_ID }),
    );
  });

  it("maps a Flow minimum-amount error to flow_amount_below_minimum", async () => {
    mockValidateSlot.mockResolvedValue({ ok: true, effectiveAmount: 200, currency: "CLP" });
    mockLoadCreds.mockResolvedValue({ enabled: true, apiKey: "k", secretKey: "s" });
    mockReserveSlot.mockResolvedValue({ ok: true, commerceRef: "flow-ref-1" });
    mockCreateOrder.mockResolvedValue({ ok: false, error: "1901 minimum" });
    mockExtractMin.mockReturnValue(350);

    const result = await startFlowMonthlyPaymentCore(baseInput);
    expect(result).toEqual({
      ok: false,
      code: "flow_amount_below_minimum",
      flowMinClp: 350,
    });
  });

  it("returns flow_error on a generic create failure", async () => {
    mockValidateSlot.mockResolvedValue({ ok: true, effectiveAmount: 50000, currency: "CLP" });
    mockLoadCreds.mockResolvedValue({ enabled: true, apiKey: "k", secretKey: "s" });
    mockReserveSlot.mockResolvedValue({ ok: true, commerceRef: "flow-ref-1" });
    mockCreateOrder.mockResolvedValue({ ok: false, error: "boom" });

    const result = await startFlowMonthlyPaymentCore(baseInput);
    expect(result).toEqual({ ok: false, code: "flow_error" });
    expect(mockLogInvariant).toHaveBeenCalled();
  });
});
