/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { revertRegistrationFunnelStageAction } from "@/app/[locale]/dashboard/admin/registrations/revertRegistrationFunnelStageAction";

const REG_ID = "123e4567-e89b-12d3-a456-426614174000";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/[locale]/dashboard/admin/academic/revalidatePaths", () => ({
  revalidateAcademicSurfaces: vi.fn(),
}));

const audit = vi.hoisted(() => vi.fn(async () => ({ ok: true })));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...args: unknown[]) => audit(...args),
}));

const assertAdmin = vi.hoisted(() => vi.fn());
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => assertAdmin(),
}));

vi.mock("@/lib/register/markRegistrationRowsEnrollmentFee", () => ({
  collectSectionsChargingEnrollmentFee: async () => new Set<string>(),
}));

const from = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: async () => ({ from: (...args: unknown[]) => from(...args) }),
}));

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: REG_ID,
    status: "new",
    intake_state: "needs_section",
    fee_snapshot: { total: 80 },
    fee_captured: true,
    enrollment_fee_mail_sent_at: "2026-11-10T00:00:00.000Z",
    accepted_student_id: "stu-1",
    preferred_section_id: null,
    additional_section_ids: [],
    ...overrides,
  };
}

function mockTable(row: Record<string, unknown> | null) {
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq });
  from.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: row, error: null }),
      }),
    }),
    update,
  });
  return { update };
}

describe("revertRegistrationFunnelStageAction", () => {
  beforeEach(() => {
    assertAdmin.mockResolvedValue({ user: { id: "actor-1" } });
    audit.mockClear();
    from.mockReset();
  });

  it("clears a captured fee and keeps the student id off the patch", async () => {
    const { update } = mockTable(lead());
    const result = await revertRegistrationFunnelStageAction({
      locale: "es",
      registrationId: REG_ID,
    });
    expect(result).toEqual({ ok: true });
    const patch = update.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(patch.fee_captured).toBe(false);
    expect(patch).not.toHaveProperty("accepted_student_id");
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceId: REG_ID,
        payload: { from_stage: "paid_without_section", to_stage: "awaiting_payment" },
      }),
    );
  });

  it("refuses an enrolled lead", async () => {
    const { update } = mockTable(lead({ status: "enrolled" }));
    const result = await revertRegistrationFunnelStageAction({
      locale: "es",
      registrationId: REG_ID,
    });
    expect(result).toEqual({ ok: false, code: "funnel_revert_not_allowed" });
    expect(update).not.toHaveBeenCalled();
  });
});
