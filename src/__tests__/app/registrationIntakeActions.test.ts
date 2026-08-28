/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertAdmin: vi.fn(),
  accept: vi.fn(),
  sendFamily: vi.fn(),
  createAdmin: vi.fn(),
  getDictionary: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mocks.assertAdmin(),
}));
vi.mock("@/lib/register/acceptRegistrationLead", () => ({
  acceptRegistrationLead: mocks.accept,
}));
vi.mock("@/lib/email/templates/sendBrandedEmail", () => ({
  sendBrandedEmail: mocks.sendFamily,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mocks.createAdmin(),
}));
vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: mocks.getDictionary,
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerAuthzDenied: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn(),
}));
vi.mock("@/app/[locale]/dashboard/admin/academic/revalidatePaths", () => ({
  revalidateAcademicSurfaces: vi.fn(),
}));

import {
  approveRegistrationReceiptAction,
  assignRegistrationSectionAction,
  rejectRegistrationReceiptAction,
  waiveRegistrationFeeAction,
} from "@/app/[locale]/dashboard/admin/registrations/registrationIntakeActions";

const REG_ID = "123e4567-e89b-12d3-a456-426614174000";
const SEC_ID = "11111111-1111-4111-8111-111111111111";

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: REG_ID,
    status: "new",
    intake_state: "awaiting_fee",
    fee_snapshot: { total: 80, currency: "CLP" },
    student_email: "ana@example.com",
    email: "ana@example.com",
    tutor_email: null,
    is_minor: false,
    first_name: "Ana",
    last_name: "Pérez",
    pay_token: "tok",
    preferred_section_id: SEC_ID,
    ...overrides,
  };
}

function adminFrom(row: Record<string, unknown> | null, update?: (v: Record<string, unknown>) => void) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: row, error: null }),
        }),
      }),
      update: (values: Record<string, unknown>) => {
        update?.(values);
        return { eq: async () => ({ error: null }) };
      },
    }),
    rpc: async () => ({ data: true, error: null }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.assertAdmin.mockResolvedValue({ supabase: { kind: "admin-session" }, user: { id: "admin-1" } });
  mocks.getDictionary.mockResolvedValue({
    register: { enrollmentPayUndecidedSection: "horario", enrollmentPayCta: "Pagar" },
    admin: { registrations: {} },
  });
  mocks.accept.mockResolvedValue({ ok: true, studentId: "stu-1", pendingSectionIds: [] });
  mocks.sendFamily.mockResolvedValue({ ok: true });
});

describe("waiveRegistrationFeeAction", () => {
  it("rejects an empty reason", async () => {
    const r = await waiveRegistrationFeeAction({
      locale: "es",
      registrationId: REG_ID,
      reason: "  ",
    });
    expect(r).toEqual({ ok: false, code: "reason_required" });
    expect(mocks.accept).not.toHaveBeenCalled();
  });

  it("waives and enrols when a reason is present", async () => {
    mocks.createAdmin.mockReturnValue(adminFrom(lead()));
    const r = await waiveRegistrationFeeAction({
      locale: "es",
      registrationId: REG_ID,
      reason: "beca",
    });
    expect(r).toEqual({ ok: true });
    expect(mocks.accept).toHaveBeenCalledWith(
      expect.objectContaining({
        registrationId: REG_ID,
        waiveReason: "beca",
      }),
    );
  });
});

describe("rejectRegistrationReceiptAction", () => {
  it("returns the lead to awaiting_fee and emails the family", async () => {
    let updated: Record<string, unknown> | undefined;
    mocks.createAdmin.mockReturnValue(adminFrom(lead({ intake_state: "receipt_pending" }), (v) => {
      updated = v;
    }));
    const r = await rejectRegistrationReceiptAction({
      locale: "es",
      registrationId: REG_ID,
      note: "ilegible",
    });
    expect(r).toEqual({ ok: true });
    expect(updated).toMatchObject({ intake_state: "awaiting_fee" });
    expect(mocks.sendFamily).toHaveBeenCalledWith(
      expect.objectContaining({ templateKey: "registration.receipt_rejected" }),
    );
  });
});

describe("assignRegistrationSectionAction", () => {
  it("rejects a full section", async () => {
    mocks.createAdmin.mockReturnValue({
      ...adminFrom(lead({ intake_state: "needs_section" })),
      rpc: async () => ({ data: false, error: null }),
    });
    const r = await assignRegistrationSectionAction({
      locale: "es",
      registrationId: REG_ID,
      sectionId: SEC_ID,
    });
    expect(r).toEqual({ ok: false, code: "section_full" });
    expect(mocks.accept).not.toHaveBeenCalled();
  });
});
