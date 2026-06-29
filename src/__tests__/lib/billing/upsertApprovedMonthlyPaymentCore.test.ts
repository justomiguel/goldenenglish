/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockPlan = vi.fn();
const mockAudit = vi.fn();

vi.mock("@/lib/billing/resolveSectionPlanMonthlyAmount", () => ({
  resolveSectionPlanMonthlyAmount: (...a: unknown[]) => mockPlan(...a),
}));
vi.mock("@/lib/audit", () => ({
  auditFinanceAction: (...a: unknown[]) => mockAudit(...a),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import { upsertApprovedMonthlyPaymentCore } from "@/lib/billing/upsertApprovedMonthlyPaymentCore";

const STUDENT_ID = "11111111-1111-4111-8111-111111111111";
const SECTION_ID = "22222222-2222-4222-8222-222222222222";
const PAY_ID = "44444444-4444-4444-8444-444444444444";

// Mutable terminal results shared by the chainable Supabase mock.
let selectResult: { data: unknown; error: unknown };
let insertResult: { data: unknown; error: unknown };
let updateResult: { error: unknown };

function makeAdmin() {
  const builder: Record<string, unknown> = {};
  Object.assign(builder, {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    in: () => Promise.resolve(updateResult),
    maybeSingle: () => Promise.resolve(selectResult),
    single: () => Promise.resolve(insertResult),
  });
  return { from: vi.fn(() => builder) } as never;
}

const baseSlot = {
  studentId: STUDENT_ID,
  sectionId: SECTION_ID,
  month: 6,
  year: 2026,
  parentId: null,
};

const baseInput = {
  admin: makeAdmin(),
  slot: baseSlot,
  gatewayProvider: "mercadopago" as const,
  gatewayAmount: 50000,
  gatewayCurrency: "CLP",
  source: "mercadopago",
  gatewayPaymentRef: 999,
  mpPreferenceId: null,
};

function okPlan() {
  mockPlan.mockResolvedValue({
    code: "ok",
    amount: 50000,
    currency: "CLP",
    proration: { numerator: 1, denominator: 1, full: true },
  });
}

describe("upsertApprovedMonthlyPaymentCore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectResult = { data: null, error: null };
    insertResult = { data: null, error: null };
    updateResult = { error: null };
    mockAudit.mockResolvedValue({ ok: true });
  });

  it("skips when the slot has no section id", async () => {
    const r = await upsertApprovedMonthlyPaymentCore({
      ...baseInput,
      admin: makeAdmin(),
      slot: { ...baseSlot, sectionId: null },
    });
    expect(r).toEqual({ ok: true, skipped: "no_section_id" });
    expect(mockPlan).not.toHaveBeenCalled();
  });

  it("skips when the plan is not resolvable", async () => {
    mockPlan.mockResolvedValue({ code: "no_plan" });
    const r = await upsertApprovedMonthlyPaymentCore({ ...baseInput, admin: makeAdmin() });
    expect(r).toEqual({ ok: true, skipped: "plan_no_plan" });
  });

  it("skips on currency mismatch", async () => {
    okPlan();
    const r = await upsertApprovedMonthlyPaymentCore({
      ...baseInput,
      admin: makeAdmin(),
      gatewayCurrency: "ARS",
    });
    expect(r).toEqual({ ok: true, skipped: "currency_mismatch" });
  });

  it("skips on amount mismatch", async () => {
    okPlan();
    const r = await upsertApprovedMonthlyPaymentCore({
      ...baseInput,
      admin: makeAdmin(),
      gatewayAmount: 49000,
    });
    expect(r).toEqual({ ok: true, skipped: "amount_mismatch" });
  });

  it("is idempotent when the row is already approved", async () => {
    okPlan();
    selectResult = {
      data: { id: PAY_ID, status: "approved", amount: 50000, admin_notes: null },
      error: null,
    };
    const r = await upsertApprovedMonthlyPaymentCore({ ...baseInput, admin: makeAdmin() });
    expect(r).toMatchObject({ ok: true, approved: true, paymentId: PAY_ID, alreadyApproved: true });
    expect(mockAudit).not.toHaveBeenCalled();
  });

  it("promotes an existing pending row to approved", async () => {
    okPlan();
    selectResult = {
      data: { id: PAY_ID, status: "pending", amount: 50000, admin_notes: null },
      error: null,
    };
    const r = await upsertApprovedMonthlyPaymentCore({ ...baseInput, admin: makeAdmin() });
    expect(r).toMatchObject({
      ok: true,
      approved: true,
      paymentId: PAY_ID,
      alreadyApproved: false,
      amount: 50000,
      currency: "CLP",
    });
    expect(mockAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "approve" }));
  });

  it("rolls back the promotion when audit fails", async () => {
    okPlan();
    selectResult = {
      data: { id: PAY_ID, status: "pending", amount: 50000, admin_notes: null },
      error: null,
    };
    mockAudit.mockResolvedValue({ ok: false });
    const r = await upsertApprovedMonthlyPaymentCore({ ...baseInput, admin: makeAdmin() });
    expect(r).toEqual({ ok: false });
  });

  it("inserts a new approved row when none exists", async () => {
    okPlan();
    selectResult = { data: null, error: null };
    insertResult = { data: { id: PAY_ID }, error: null };
    const r = await upsertApprovedMonthlyPaymentCore({ ...baseInput, admin: makeAdmin() });
    expect(r).toMatchObject({
      ok: true,
      approved: true,
      paymentId: PAY_ID,
      alreadyApproved: false,
    });
    expect(mockAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "create" }));
  });

  it("deletes the inserted row when audit fails", async () => {
    okPlan();
    selectResult = { data: null, error: null };
    insertResult = { data: { id: PAY_ID }, error: null };
    mockAudit.mockResolvedValue({ ok: false });
    const r = await upsertApprovedMonthlyPaymentCore({ ...baseInput, admin: makeAdmin() });
    expect(r).toEqual({ ok: false });
  });

  it("returns ok:false when the lookup fails", async () => {
    okPlan();
    selectResult = { data: null, error: { message: "boom" } };
    const r = await upsertApprovedMonthlyPaymentCore({ ...baseInput, admin: makeAdmin() });
    expect(r).toEqual({ ok: false });
  });
});
