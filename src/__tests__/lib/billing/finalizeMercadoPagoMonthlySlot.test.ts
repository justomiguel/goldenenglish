/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

const mockUpsertCore = vi.fn();
const mockMpFinalize = vi.fn();
const mockNotify = vi.fn();
const mockLocale = vi.fn();

vi.mock("@/lib/billing/upsertApprovedMonthlyPaymentCore", () => ({
  upsertApprovedMonthlyPaymentCore: (...a: unknown[]) => mockUpsertCore(...a),
}));
vi.mock("@/lib/billing/upsertMpFinalizeRecord", () => ({
  upsertMpFinalizeRecord: (...a: unknown[]) => mockMpFinalize(...a),
}));
vi.mock("@/lib/billing/notifyAndRevalidateMonthlyApproval", () => ({
  notifyAndRevalidateMonthlyApproval: (...a: unknown[]) => mockNotify(...a),
}));
vi.mock("@/lib/i18n/resolveUserLocale", () => ({
  resolveUserLocale: (...a: unknown[]) => mockLocale(...a),
}));

import { finalizeMercadoPagoMonthlySlot } from "@/lib/billing/finalizeMercadoPagoMonthlySlot";
import type { MercadoPagoPaymentPayload } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";

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
  id: 999,
  transaction_amount: 50000,
  currency_id: "CLP",
} as unknown as MercadoPagoPaymentPayload;

function makeAdmin() {
  return { from: vi.fn(() => ({ insert: vi.fn() })) } as unknown as SupabaseClient;
}

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

describe("finalizeMercadoPagoMonthlySlot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocale.mockResolvedValue("es");
  });

  it("returns ok:false when the upsert core fails", async () => {
    mockUpsertCore.mockResolvedValue({ ok: false });
    const r = await finalizeMercadoPagoMonthlySlot({ admin: makeAdmin(), slot, snapshot });
    expect(r).toEqual({ ok: false });
    expect(mockMpFinalize).not.toHaveBeenCalled();
  });

  it("propagates a skipped result", async () => {
    mockUpsertCore.mockResolvedValue({ ok: true, skipped: "currency_mismatch" });
    const r = await finalizeMercadoPagoMonthlySlot({ admin: makeAdmin(), slot, snapshot });
    expect(r).toEqual({ ok: true, skipped: "currency_mismatch" });
    expect(mockMpFinalize).not.toHaveBeenCalled();
  });

  it("stores the finalize record but skips notification when already approved", async () => {
    mockUpsertCore.mockResolvedValue(approved(true));
    const r = await finalizeMercadoPagoMonthlySlot({ admin: makeAdmin(), slot, snapshot });
    expect(r).toEqual({ ok: true, approved: true, paymentId: PAY_ID });
    expect(mockMpFinalize).toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("notifies and records analytics on a fresh approval", async () => {
    mockUpsertCore.mockResolvedValue(approved(false));
    const admin = makeAdmin();
    const r = await finalizeMercadoPagoMonthlySlot({ admin, slot, snapshot });
    expect(r).toEqual({ ok: true, approved: true, paymentId: PAY_ID });
    expect(mockMpFinalize).toHaveBeenCalled();
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: STUDENT_ID, amount: 50000, currency: "CLP" }),
    );
    expect(admin.from).toHaveBeenCalledWith("user_events");
  });
});
