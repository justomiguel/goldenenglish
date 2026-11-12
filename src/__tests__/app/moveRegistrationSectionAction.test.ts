/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { moveRegistrationSectionAction } from "@/app/[locale]/dashboard/admin/registrations/moveRegistrationSectionAction";

const REG_ID = "123e4567-e89b-12d3-a456-426614174000";
const STUDENT_ID = "523e4567-e89b-12d3-a456-426614174000";
const COHORT_ID = "323e4567-e89b-12d3-a456-426614174000";
const SECTION_ID = "223e4567-e89b-12d3-a456-426614174000";
const OTHER_ID = "423e4567-e89b-12d3-a456-426614174000";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const audit = vi.hoisted(() => vi.fn(async () => ({ ok: true })));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...args: unknown[]) => audit(...args),
}));

const assertAdmin = vi.hoisted(() => vi.fn());
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => assertAdmin(),
}));

const from = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: async () => ({ from: (...args: unknown[]) => from(...args) }),
}));

const enrollmentUpdates = vi.hoisted(() => [] as Record<string, unknown>[]);
const enrollmentInserts = vi.hoisted(() => [] as Record<string, unknown>[]);
const registrationUpdates = vi.hoisted(() => [] as Record<string, unknown>[]);

function install(opts: {
  registration: Record<string, unknown> | null;
  section: Record<string, unknown> | null;
  enrollments: Record<string, unknown>[];
}) {
  from.mockImplementation((table: string) => {
    if (table === "registrations") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: opts.registration, error: null }),
          }),
        }),
        update: (patch: Record<string, unknown>) => ({
          eq: async () => {
            registrationUpdates.push(patch);
            return { error: null };
          },
        }),
      };
    }
    if (table === "academic_sections") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: opts.section, error: null }),
          }),
        }),
      };
    }
    return {
      select: () => ({
        eq: () => ({
          eq: async () => ({ data: opts.enrollments, error: null }),
        }),
      }),
      update: (patch: Record<string, unknown>) => ({
        in: async () => {
          enrollmentUpdates.push(patch);
          return { error: null };
        },
      }),
      insert: async (row: Record<string, unknown>) => {
        enrollmentInserts.push(row);
        return { error: null };
      },
    };
  });
}

describe("moveRegistrationSectionAction", () => {
  beforeEach(() => {
    assertAdmin.mockResolvedValue({ user: { id: "actor-1" } });
    audit.mockClear();
    enrollmentUpdates.length = 0;
    enrollmentInserts.length = 0;
    registrationUpdates.length = 0;
  });

  it("refuses the section the student already has", async () => {
    install({
      registration: { id: REG_ID, status: "enrolled", accepted_student_id: STUDENT_ID },
      section: { id: SECTION_ID, cohort_id: COHORT_ID },
      enrollments: [
        { id: "enr-1", section_id: SECTION_ID, academic_sections: { cohort_id: COHORT_ID } },
      ],
    });
    const result = await moveRegistrationSectionAction({
      locale: "es",
      registrationId: REG_ID,
      sectionId: SECTION_ID,
      cohortId: COHORT_ID,
    });
    expect(result).toEqual({ ok: false, code: "section_move_same" });
    expect(enrollmentUpdates).toEqual([]);
  });

  it("refuses a section outside the selected cohort", async () => {
    install({
      registration: { id: REG_ID, status: "enrolled", accepted_student_id: STUDENT_ID },
      section: { id: OTHER_ID, cohort_id: "999e4567-e89b-12d3-a456-426614174000" },
      enrollments: [],
    });
    const result = await moveRegistrationSectionAction({
      locale: "es",
      registrationId: REG_ID,
      sectionId: OTHER_ID,
      cohortId: COHORT_ID,
    });
    expect(result).toEqual({ ok: false, code: "section_move_outside_cohort" });
    expect(enrollmentInserts).toEqual([]);
  });

  it("transfers the old enrollment and keeps the payment columns", async () => {
    install({
      registration: { id: REG_ID, status: "enrolled", accepted_student_id: STUDENT_ID },
      section: { id: OTHER_ID, cohort_id: COHORT_ID },
      enrollments: [
        { id: "enr-1", section_id: SECTION_ID, academic_sections: { cohort_id: COHORT_ID } },
        { id: "enr-2", section_id: "other-cohort", academic_sections: { cohort_id: "elsewhere" } },
      ],
    });
    const result = await moveRegistrationSectionAction({
      locale: "es",
      registrationId: REG_ID,
      sectionId: OTHER_ID,
      cohortId: COHORT_ID,
    });
    expect(result).toEqual({ ok: true });
    expect(enrollmentUpdates).toEqual([{ status: "transferred" }]);
    expect(enrollmentInserts).toEqual([
      { section_id: OTHER_ID, student_id: STUDENT_ID, status: "active" },
    ]);
    expect(registrationUpdates).toEqual([]);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "registration_section_move",
        resourceId: REG_ID,
        payload: { cohort_id: COHORT_ID, section_id: OTHER_ID },
      }),
    );
  });
});
