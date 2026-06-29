/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

const mockUpsertCore = vi.fn();
const mockFlowFinalize = vi.fn();
const mockNotify = vi.fn();

vi.mock("@/lib/billing/upsertApprovedMonthlyPaymentCore", () => ({
  upsertApprovedMonthlyPaymentCore: (...a: unknown[]) => mockUpsertCore(...a),
}));
vi.mock("@/lib/billing/upsertFlowFinalizeRecord", () => ({
  upsertFlowFinalizeRecord: (...a: unknown[]) => mockFlowFinalize(...a),
}));
vi.mock("@/lib/billing/notifyAndRevalidateMonthlyApproval", () => ({
  notifyAndRevalidateMonthlyApproval: (...a: unknown[]) => mockNotify(...a),
}));

import { finalizeFlowMonthlySlot } from "@/lib/billing/finalizeFlowMonthlySlot";
import type { FlowStatusPayload } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";

const STUDENT_ID = "11111111-1111-4111-8111-111111111111";
const SECTION_ID = "22222222-2222-4222-8222-222222222222";
const PAY_ID = "44444444-4444-4444-8444-444444444444";

const slot = {
  studentId: STUDENT_ID,
  sectionId: SECTION_ID,
  year: 2026,
  month: 6,
  parentId: null,
};

const snapshot = {
  amount: 50000,
  currency: "CLP",
  flowOrder: 12345,
} as unknown as FlowStatusPayload;

const admin = {} as unknown as SupabaseClient;

const approved = (alreadyApproved: boolean) => ({
  ok: true,
  approved: true,
  paymentId: PAY_ID,
  studentId: STUDENT_ID,
  sectionId: SECTION_ID,
  month: 6,
  year: 2026,
  amount: 50000,
  currency: "CLP",
  alreadyApproved,
});

describe("finalizeFlowMonthlySlot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok:false when the upsert core fails", async () => {
    mockUpsertCore.mockResolvedValue({ ok: false });
    const r = await finalizeFlowMonthlySlot({ admin, slot, snapshot });
    expect(r).toEqual({ ok: false });
    expect(mockFlowFinalize).not.toHaveBeenCalled();
  });

  it("propagates a skipped result", async () => {
    mockUpsertCore.mockResolvedValue({ ok: true, skipped: "amount_mismatch" });
    const r = await finalizeFlowMonthlySlot({ admin, slot, snapshot });
    expect(r).toEqual({ ok: true, skipped: "amount_mismatch" });
    expect(mockFlowFinalize).not.toHaveBeenCalled();
  });

  it("stores the finalize record but skips notification when already approved", async () => {
    mockUpsertCore.mockResolvedValue(approved(true));
    const r = await finalizeFlowMonthlySlot({ admin, slot, snapshot });
    expect(r).toEqual({ ok: true, approved: true, paymentId: PAY_ID });
    expect(mockFlowFinalize).toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("notifies on a fresh approval", async () => {
    mockUpsertCore.mockResolvedValue(approved(false));
    const r = await finalizeFlowMonthlySlot({ admin, slot, snapshot });
    expect(r).toEqual({ ok: true, approved: true, paymentId: PAY_ID });
    expect(mockFlowFinalize).toHaveBeenCalled();
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: STUDENT_ID, amount: 50000, currency: "CLP" }),
    );
  });
});
