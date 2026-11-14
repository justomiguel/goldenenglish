/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { moveStudentSectionWithCarryAction } from "@/app/[locale]/dashboard/admin/academic/moveStudentSectionWithCarryAction";
import { DEFAULT_SECTION_MOVE_CARRY } from "@/lib/academics/planSectionMoveCarry";

const STUDENT = "523e4567-e89b-12d3-a456-426614174000";
const TO = "223e4567-e89b-12d3-a456-426614174000";
const FROM = "623e4567-e89b-12d3-a456-426614174000";
const ORIGIN_PAY = "723e4567-e89b-12d3-a456-426614174010";
const DEST_PAY = "723e4567-e89b-12d3-a456-426614174011";
const NEW_ENR = "823e4567-e89b-12d3-a456-426614174000";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const audit = vi.hoisted(() => vi.fn(async () => ({ ok: true })));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...args: unknown[]) => audit(...args),
}));
vi.mock("@/lib/notifications/cancelReminderJobsAdmin", () => ({
  cancelReminderJobsForEnrollmentId: vi.fn(async () => undefined),
}));

const rpc = vi.hoisted(() => vi.fn());
const from = vi.hoisted(() => vi.fn());
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: async () => ({ user: { id: "actor-1" }, supabase: { from, rpc } }),
}));

function list(data: unknown) {
  const api: Record<string, unknown> = {};
  const self = () => api;
  for (const name of ["select", "eq", "in", "is"]) api[name] = self;
  api.then = (resolve: (value: unknown) => unknown) => {
    resolve({ data, error: null });
    return Promise.resolve();
  };
  return api;
}

describe("moveStudentSectionWithCarryAction", () => {
  beforeEach(() => {
    rpc.mockReset();
    audit.mockClear();
    from.mockImplementation((table: string) => {
      if (table === "section_enrollments") return list([{ id: FROM, section_id: "origin-section" }]);
      if (table === "payments") {
        return list([
          { id: ORIGIN_PAY, section_id: "origin-section", month: 3, year: 2026 },
          { id: DEST_PAY, section_id: TO, month: 3, year: 2026 },
        ]);
      }
      return list([]);
    });
  });

  it("saves nothing when a colliding month has no choice", async () => {
    const result = await moveStudentSectionWithCarryAction({
      locale: "en",
      studentId: STUDENT,
      toSectionId: TO,
      fromEnrollmentIds: [FROM],
      carry: DEFAULT_SECTION_MOVE_CARRY,
      choices: [],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("carry_choice_missing");
    expect(result.detail).toContain("2026");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("calls the carry function and records the audit", async () => {
    from.mockImplementation((table: string) => {
      if (table === "section_enrollments") return list([{ id: FROM, section_id: "origin-section" }]);
      return list([]);
    });
    rpc.mockResolvedValue({ data: { enrollment_id: NEW_ENR }, error: null });
    const result = await moveStudentSectionWithCarryAction({
      locale: "en",
      studentId: STUDENT,
      toSectionId: TO,
      fromEnrollmentIds: [FROM],
      carry: { ...DEFAULT_SECTION_MOVE_CARRY, payments: false },
      choices: [],
    });
    expect(result).toEqual({ ok: true, enrollmentId: NEW_ENR });
    expect(rpc).toHaveBeenCalledWith(
      "move_student_section_with_carry",
      expect.objectContaining({
        p_student_id: STUDENT,
        p_to_section_id: TO,
        p_from_enrollment_ids: [FROM],
        p_carry: expect.objectContaining({ payments: false, enrollmentFee: true }),
      }),
    );
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "academic_section_move_carry",
        resourceType: "section_enrollment",
        resourceId: NEW_ENR,
      }),
    );
  });
});
