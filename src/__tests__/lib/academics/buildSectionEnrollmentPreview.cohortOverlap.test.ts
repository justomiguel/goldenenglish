// REGRESSION CHECK: the same weekday hour in another cohort is not a schedule conflict.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSectionEnrollmentPreview } from "@/lib/academics/buildSectionEnrollmentPreview";

const TARGET = "00000000-0000-4000-8000-000000000021";
const OTHER = "00000000-0000-4000-8000-000000000022";
const STUDENT = "00000000-0000-4000-8000-000000000023";
const SLOT = [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }];

vi.mock("@/lib/academics/getDefaultSectionMaxStudents", () => ({
  getDefaultSectionMaxStudents: () => 20,
}));

vi.mock("@/lib/academics/parentPaymentPending", () => ({
  loadParentPaymentPendingForStudent: async () => false,
}));

let otherCohortId = "cohort-b";
let enrollmentFromCalls = 0;

function from(table: string) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = chain;
  builder.eq = chain;
  builder.in = chain;
  builder.maybeSingle = () =>
    Promise.resolve({
      data: {
        id: TARGET,
        name: "New",
        cohort_id: "cohort-a",
        schedule_slots: SLOT,
        max_students: 20,
        archived_at: null,
        academic_cohorts: { name: "2027", archived_at: null },
      },
      error: null,
    });
  builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => {
    if (table === "section_enrollments") {
      enrollmentFromCalls += 1;
      const payload =
        enrollmentFromCalls === 1
          ? { count: 0, error: null }
          : { data: [{ id: "enr-1", section_id: OTHER }], error: null };
      return Promise.resolve(payload).then(resolve, reject);
    }
    return Promise.resolve({
      data: [
        {
          id: OTHER,
          name: "Old",
          cohort_id: otherCohortId,
          schedule_slots: SLOT,
          academic_cohorts: { name: "2026" },
        },
      ],
      error: null,
    }).then(resolve, reject);
  };
  return builder;
}

describe("buildSectionEnrollmentPreview cohort overlap", () => {
  beforeEach(() => {
    otherCohortId = "cohort-b";
    enrollmentFromCalls = 0;
  });

  it("allows the same hour when the other section is in another cohort", async () => {
    const result = await buildSectionEnrollmentPreview({ from } as never, {
      studentId: STUDENT,
      sectionId: TARGET,
    });
    expect(result.ok).toBe(true);
  });

  it("blocks the same hour inside one cohort", async () => {
    otherCohortId = "cohort-a";
    const result = await buildSectionEnrollmentPreview({ from } as never, {
      studentId: STUDENT,
      sectionId: TARGET,
    });
    expect(result).toMatchObject({ ok: false, code: "SCHEDULE_OVERLAP" });
  });
});
