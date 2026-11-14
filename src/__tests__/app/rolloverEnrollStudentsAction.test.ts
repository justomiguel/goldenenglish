// REGRESSION CHECK: another cohort copies the student. The same cohort closes the source enrollment.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { rolloverEnrollStudentsAction } from "@/app/[locale]/dashboard/admin/academic/rolloverEnrollStudentsAction";

const SRC = "00000000-0000-4000-8000-000000000031";
const TGT = "00000000-0000-4000-8000-000000000032";
const STUDENT = "00000000-0000-4000-8000-000000000033";
const DROP = "00000000-0000-4000-8000-000000000034";

const commitRpc = vi.fn();
let targetCohort = "cohort-b";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/[locale]/dashboard/admin/academic/revalidatePaths", () => ({
  revalidateAcademicSurfaces: vi.fn(),
}));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({ recordSystemAudit: vi.fn() }));
vi.mock("@/lib/logging/serverActionLog", () => ({ logServerException: vi.fn() }));
vi.mock("@/lib/notifications/cancelReminderJobsAdmin", () => ({
  cancelReminderJobsForEnrollmentId: vi.fn(),
}));
vi.mock("@/lib/academics/buildSectionEnrollmentPreview", () => ({
  buildSectionEnrollmentPreview: async () => ({ ok: true, parentPaymentsPending: false }),
}));
vi.mock("@/lib/academics/commitSectionEnrollmentRpc", () => ({
  commitSectionEnrollmentRpc: (...args: unknown[]) => commitRpc(...args),
}));
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: async () => ({ supabase: { from }, user: { id: "admin" } }),
}));

function from(table: string) {
  if (table === "academic_sections") {
    const payload = {
      data: [
        { id: SRC, cohort_id: "cohort-a" },
        { id: TGT, cohort_id: targetCohort },
      ],
      error: null,
    };
    const builder: Record<string, unknown> = {};
    const chain = () => builder;
    builder.select = chain;
    builder.in = chain;
    builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(payload).then(resolve, reject);
    return builder;
  }
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: { id: DROP }, error: null }),
          }),
        }),
      }),
    }),
  };
}

describe("rolloverEnrollStudentsAction", () => {
  beforeEach(() => {
    targetCohort = "cohort-b";
    commitRpc.mockReset();
    commitRpc.mockResolvedValue({ ok: true, enrollmentId: "new-enr" });
  });

  it("copies into another cohort and keeps the source enrollment", async () => {
    const result = await rolloverEnrollStudentsAction({
      locale: "es",
      sourceSectionId: SRC,
      targetSectionId: TGT,
      studentIds: [STUDENT],
    });
    expect(result).toEqual({ ok: true, enrolled: 1 });
    expect(commitRpc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ dropId: null, sectionId: TGT, studentId: STUDENT }),
    );
  });

  it("moves inside the same cohort", async () => {
    targetCohort = "cohort-a";
    await rolloverEnrollStudentsAction({
      locale: "es",
      sourceSectionId: SRC,
      targetSectionId: TGT,
      studentIds: [STUDENT],
    });
    expect(commitRpc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ dropId: DROP, dropNext: "transferred" }),
    );
  });
});
