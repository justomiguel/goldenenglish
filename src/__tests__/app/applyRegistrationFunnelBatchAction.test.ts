/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyRegistrationFunnelBatchAction } from "@/app/[locale]/dashboard/admin/registrations/applyRegistrationFunnelBatchAction";

const FEE_ID = "123e4567-e89b-12d3-a456-426614174001";
const ZERO_ID = "123e4567-e89b-12d3-a456-426614174002";
const PAID_ID = "123e4567-e89b-12d3-a456-426614174003";
const LEFT_ID = "123e4567-e89b-12d3-a456-426614174004";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const audit = vi.hoisted(() => vi.fn(async () => ({ ok: true })));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...args: unknown[]) => audit(...args),
}));

const assertAdmin = vi.hoisted(() => vi.fn());
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => assertAdmin(),
}));

const revalidate = vi.hoisted(() => vi.fn());
vi.mock("@/lib/register/registrationIntakeActionSupport", () => ({
  revalidateRegistrationInbox: (...args: unknown[]) => revalidate(...args),
}));

vi.mock("@/lib/register/markRegistrationRowsEnrollmentFee", () => ({
  collectSectionsChargingEnrollmentFee: async () => new Set<string>(),
}));

const mark = vi.hoisted(() => vi.fn(async () => ({ ok: true })));
vi.mock("@/app/[locale]/dashboard/admin/registrations/registrationStatusAction", () => ({
  markRegistrationContacted: (...args: unknown[]) => mark(...args),
}));

const revert = vi.hoisted(() => vi.fn(async () => ({ ok: true })));
vi.mock("@/app/[locale]/dashboard/admin/registrations/revertRegistrationFunnelStageAction", () => ({
  revertRegistrationFunnelStageAction: (...args: unknown[]) => revert(...args),
}));

const from = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: async () => ({ from: (...args: unknown[]) => from(...args) }),
}));

function lead(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    status: "new",
    intake_state: "none",
    fee_snapshot: null,
    fee_captured: false,
    enrollment_fee_mail_sent_at: null,
    accepted_student_id: null,
    preferred_section_id: null,
    additional_section_ids: [],
    ...overrides,
  };
}

function mockLeads(rows: Record<string, unknown>[]) {
  from.mockReturnValue({
    select: () => ({
      in: async () => ({ data: rows, error: null }),
    }),
  });
}

describe("applyRegistrationFunnelBatchAction", () => {
  beforeEach(() => {
    assertAdmin.mockResolvedValue({ user: { id: "actor-1" } });
    audit.mockClear();
    mark.mockReset();
    mark.mockResolvedValue({ ok: true });
    revert.mockReset();
    revert.mockResolvedValue({ ok: true });
    revalidate.mockClear();
    from.mockReset();
  });

  it("marks only the given Inscriptos ids, fee and zero-fee", async () => {
    mockLeads([
      lead(FEE_ID, { fee_snapshot: { total: 80 } }),
      lead(ZERO_ID, { accepted_student_id: "stu-zero" }),
      lead(PAID_ID, { fee_captured: true, fee_snapshot: { total: 80 } }),
    ]);
    const result = await applyRegistrationFunnelBatchAction({
      locale: "es",
      stage: "registered",
      registrationIds: [FEE_ID, ZERO_ID],
    });
    expect(result).toMatchObject({ ok: true, updated: 2, failed: 0 });
    expect(mark).toHaveBeenCalledTimes(2);
    expect(mark).toHaveBeenCalledWith("es", FEE_ID);
    expect(mark).toHaveBeenCalledWith("es", ZERO_ID);
    expect(mark).not.toHaveBeenCalledWith("es", PAID_ID);
    expect(revert).not.toHaveBeenCalled();
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "registration_funnel_batch",
        payload: { stage: "registered", updated: 2, failed: 0 },
      }),
    );
    const payload = audit.mock.calls[0]?.[0] as { payload: Record<string, unknown> };
    expect(payload.payload).not.toHaveProperty("email");
  });

  it("steps a paid lead back through the single-lead revert", async () => {
    mockLeads([
      lead(PAID_ID, {
        status: "contacted",
        fee_snapshot: { total: 80 },
        fee_captured: true,
        enrollment_fee_mail_sent_at: "2026-11-10T00:00:00.000Z",
        accepted_student_id: "stu-paid",
      }),
    ]);
    const result = await applyRegistrationFunnelBatchAction({
      locale: "es",
      stage: "paid_without_section",
      registrationIds: [PAID_ID],
    });
    expect(result).toMatchObject({ ok: true, updated: 1, failed: 0 });
    expect(revert).toHaveBeenCalledWith({ locale: "es", registrationId: PAID_ID });
    expect(mark).not.toHaveBeenCalled();
  });

  it("does not change a lead that left the stage", async () => {
    mockLeads([lead(LEFT_ID, { status: "contacted", fee_snapshot: { total: 80 } })]);
    const result = await applyRegistrationFunnelBatchAction({
      locale: "es",
      stage: "registered",
      registrationIds: [LEFT_ID],
    });
    expect(result).toMatchObject({ ok: false, code: "funnel_batch_empty" });
    expect(mark).not.toHaveBeenCalled();
    expect(revert).not.toHaveBeenCalled();
  });

  it("returns funnel_batch_empty for an empty id list", async () => {
    const result = await applyRegistrationFunnelBatchAction({
      locale: "es",
      stage: "registered",
      registrationIds: [],
    });
    expect(result).toEqual({ ok: false, code: "funnel_batch_empty", updated: 0, failed: 0 });
    expect(from).not.toHaveBeenCalled();
  });

  it("returns funnel_batch_partial with both counts", async () => {
    mockLeads([lead(FEE_ID), lead(ZERO_ID)]);
    mark.mockImplementation(async (_locale: string, id: string) =>
      id === ZERO_ID ? { ok: false, message: "no" } : { ok: true },
    );
    const result = await applyRegistrationFunnelBatchAction({
      locale: "es",
      stage: "registered",
      registrationIds: [FEE_ID, ZERO_ID],
    });
    expect(result).toEqual({ ok: false, code: "funnel_batch_partial", updated: 1, failed: 1 });
  });

  it("returns forbidden before it reads the list", async () => {
    assertAdmin.mockRejectedValue(new Error("no"));
    const result = await applyRegistrationFunnelBatchAction({
      locale: "es",
      stage: "registered",
      registrationIds: [FEE_ID],
    });
    expect(result).toMatchObject({ ok: false, code: "forbidden" });
    expect(from).not.toHaveBeenCalled();
  });
});
