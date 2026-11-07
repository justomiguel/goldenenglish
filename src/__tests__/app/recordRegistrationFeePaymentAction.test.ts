/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { todayIsoDate } from "@/lib/billing/paymentMethod";

const mocks = vi.hoisted(() => ({
  assertAdmin: vi.fn(),
  accept: vi.fn(),
  createAdmin: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mocks.assertAdmin(),
}));
vi.mock("@/lib/register/acceptRegistrationLead", () => ({
  acceptRegistrationLead: mocks.accept,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mocks.createAdmin(),
}));
vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: vi.fn(async () => ({})),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerAuthzDenied: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...args: unknown[]) => mocks.audit(...args),
}));
vi.mock("@/app/[locale]/dashboard/admin/academic/revalidatePaths", () => ({
  revalidateAcademicSurfaces: vi.fn(),
}));

import { recordRegistrationFeePaymentAction } from "@/app/[locale]/dashboard/admin/registrations/recordRegistrationFeePaymentAction";

const REG_ID = "123e4567-e89b-12d3-a456-426614174000";
const SEC_ID = "11111111-1111-4111-8111-111111111111";

function adminFor(row: Record<string, unknown> | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: row, error: null }),
        }),
      }),
      update: () => ({
        eq: async () => ({ error: null }),
      }),
    }),
  };
}

const base = {
  locale: "es",
  registrationId: REG_ID,
  method: "cash",
  amount: 15000,
  paidOn: todayIsoDate(),
  joinDisposition: { kind: "behind" as const },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.assertAdmin.mockResolvedValue({
    supabase: { kind: "session" },
    user: { id: "admin-1" },
  });
  mocks.accept.mockResolvedValue({ ok: true, studentId: "stu-1" });
});

describe("recordRegistrationFeePaymentAction", () => {
  it("rejects a lead that is not waiting for the fee", async () => {
    mocks.createAdmin.mockResolvedValue(
      adminFor({
        id: REG_ID,
        intake_state: "accepted",
        preferred_section_id: SEC_ID,
        additional_section_ids: [],
        fee_snapshot: { total: 15000 },
      }),
    );
    const result = await recordRegistrationFeePaymentAction(base);
    expect(result).toEqual({ ok: false, code: "not_found" });
    expect(mocks.accept).not.toHaveBeenCalled();
  });

  it("asks for a section when the lead has none", async () => {
    mocks.createAdmin.mockResolvedValue(
      adminFor({
        id: REG_ID,
        intake_state: "awaiting_fee",
        preferred_section_id: null,
        additional_section_ids: [],
        fee_snapshot: { total: 15000 },
      }),
    );
    const result = await recordRegistrationFeePaymentAction(base);
    expect(result).toEqual({ ok: false, code: "needs_section" });
  });

  it("accepts the lead with the cash payment", async () => {
    mocks.createAdmin.mockResolvedValue(
      adminFor({
        id: REG_ID,
        intake_state: "awaiting_fee",
        preferred_section_id: SEC_ID,
        additional_section_ids: [],
        fee_snapshot: { total: 15000 },
      }),
    );
    const result = await recordRegistrationFeePaymentAction(base);
    expect(result).toEqual({ ok: true });
    expect(mocks.audit).toHaveBeenCalled();
    expect(mocks.accept).toHaveBeenCalledWith(
      expect.objectContaining({
        paidCapture: true,
        feePayment: { method: "cash", amount: 15000, paidOn: todayIsoDate() },
        registrationId: REG_ID,
      }),
    );
  });
});
