/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { revertEnrolledRegistrationAction } from "@/app/[locale]/dashboard/admin/registrations/revertEnrolledRegistrationAction";

const REG_ID = "123e4567-e89b-12d3-a456-426614174000";
const STUDENT_ID = "523e4567-e89b-12d3-a456-426614174000";
const COHORT_ID = "323e4567-e89b-12d3-a456-426614174000";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const audit = vi.hoisted(() => vi.fn(async () => ({ ok: true })));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...args: unknown[]) => audit(...args),
}));

const assertAdmin = vi.hoisted(() => vi.fn());
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => assertAdmin(),
}));

vi.mock("@/lib/register/markRegistrationRowsEnrollmentFee", () => ({
  collectSectionsChargingEnrollmentFee: async () => new Set(["sec-fee"]),
}));

const from = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: async () => ({ from: (...args: unknown[]) => from(...args) }),
}));

const registrationPatches = vi.hoisted(() => [] as Record<string, unknown>[]);
const enrollmentPatches = vi.hoisted(() => [] as Record<string, unknown>[]);

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: REG_ID,
    status: "enrolled",
    intake_state: "none",
    fee_snapshot: { total: 80 },
    fee_captured: true,
    enrollment_fee_mail_sent_at: "2026-11-10T00:00:00.000Z",
    accepted_student_id: STUDENT_ID,
    preferred_section_id: "sec-fee",
    additional_section_ids: [],
    ...overrides,
  };
}

function install(row: Record<string, unknown> | null) {
  from.mockImplementation((table: string) => {
    if (table === "registrations") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: row, error: null }),
          }),
        }),
        update: (patch: Record<string, unknown>) => ({
          eq: async () => {
            registrationPatches.push(patch);
            return { error: null };
          },
        }),
      };
    }
    return {
      select: () => ({
        eq: () => ({
          eq: async () => ({
            data: [
              { id: "enr-1", academic_sections: { cohort_id: COHORT_ID } },
              { id: "enr-2", academic_sections: { cohort_id: "elsewhere" } },
            ],
            error: null,
          }),
        }),
      }),
      update: (patch: Record<string, unknown>) => ({
        in: async (_col: string, ids: string[]) => {
          enrollmentPatches.push({ ...patch, ids });
          return { error: null };
        },
      }),
    };
  });
}

describe("revertEnrolledRegistrationAction", () => {
  beforeEach(() => {
    assertAdmin.mockResolvedValue({ user: { id: "actor-1" } });
    audit.mockClear();
    registrationPatches.length = 0;
    enrollmentPatches.length = 0;
  });

  it("refuses a lead that is not enrolled", async () => {
    install(lead({ status: "contacted" }));
    const result = await revertEnrolledRegistrationAction({
      locale: "es",
      registrationId: REG_ID,
      cohortId: COHORT_ID,
    });
    expect(result).toEqual({ ok: false, code: "enrolled_revert_failed" });
    expect(registrationPatches).toEqual([]);
  });

  it("drops the section and clears the matrícula payment", async () => {
    install(lead());
    const result = await revertEnrolledRegistrationAction({
      locale: "es",
      registrationId: REG_ID,
      cohortId: COHORT_ID,
    });
    expect(result).toEqual({ ok: true });
    expect(enrollmentPatches).toEqual([{ status: "dropped", ids: ["enr-1"] }]);
    const patch = registrationPatches[0];
    expect(patch?.status).toBe("contacted");
    expect(patch?.fee_captured).toBe(false);
    expect(patch?.enrollment_fee_paid_method).toBeNull();
    expect(patch?.enrollment_fee_paid_amount).toBeNull();
    expect(patch?.enrollment_fee_paid_on).toBeNull();
    expect(patch).not.toHaveProperty("accepted_student_id");
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "registration_funnel_revert",
        payload: { from_stage: "enrolled_in_section", to_stage: "awaiting_payment" },
      }),
    );
    const payload = audit.mock.calls[0]?.[0] as { payload: Record<string, unknown> };
    expect(JSON.stringify(payload.payload)).not.toContain("@");
  });

  it("leaves the payment columns when there is no matrícula", async () => {
    install(
      lead({
        fee_snapshot: { total: 0 },
        fee_captured: false,
        preferred_section_id: null,
        enrollment_fee_mail_sent_at: null,
      }),
    );
    const result = await revertEnrolledRegistrationAction({
      locale: "es",
      registrationId: REG_ID,
      cohortId: COHORT_ID,
    });
    expect(result).toEqual({ ok: true });
    const patch = registrationPatches[0] ?? {};
    expect(patch.status).toBe("contacted");
    expect(patch).not.toHaveProperty("fee_captured");
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { from_stage: "enrolled_in_section", to_stage: "awaiting_section" },
      }),
    );
  });
});
