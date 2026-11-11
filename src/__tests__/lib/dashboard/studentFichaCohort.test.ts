import { describe, expect, it } from "vitest";
import {
  buildStudentCohortOptions,
  defaultStudentCohortId,
  filterPaymentsForCohort,
  preferActiveSectionBenefits,
  resolveStudentCohortId,
  type StudentFichaCohortEnrollment,
} from "@/lib/dashboard/studentFichaCohort";

// REGRESSION CHECK: The ficha cohort combo must keep the vigente cohort first
// and must hide payments that have no section.

function row(
  partial: Partial<StudentFichaCohortEnrollment> & Pick<StudentFichaCohortEnrollment, "cohortId">,
): StudentFichaCohortEnrollment {
  return {
    enrollmentId: partial.enrollmentId ?? partial.cohortId,
    cohortId: partial.cohortId,
    cohortName: partial.cohortName ?? partial.cohortId,
    isCurrent: partial.isCurrent ?? false,
    sectionId: partial.sectionId ?? "section-1",
    sectionName: partial.sectionName ?? "A1",
    status: partial.status ?? "active",
    createdAt: partial.createdAt ?? "2026-01-01T00:00:00.000Z",
    teacher: partial.teacher ?? null,
    assistants: partial.assistants ?? [],
  };
}

describe("studentFichaCohort", () => {
  it("lists each cohort once, with the vigente cohort first", () => {
    const options = buildStudentCohortOptions([
      row({ cohortId: "past", cohortName: "2025", createdAt: "2025-03-01T00:00:00.000Z" }),
      row({
        cohortId: "now",
        cohortName: "2026",
        isCurrent: true,
        createdAt: "2026-03-01T00:00:00.000Z",
      }),
      row({
        cohortId: "past",
        cohortName: "2025",
        sectionId: "section-2",
        createdAt: "2025-08-01T00:00:00.000Z",
      }),
    ]);

    expect(options.map((option) => option.id)).toEqual(["now", "past"]);
    expect(options[1]?.latestEnrollmentAt).toBe("2025-08-01T00:00:00.000Z");
  });

  it("defaults to the vigente cohort and rejects an unknown id", () => {
    const options = buildStudentCohortOptions([
      row({ cohortId: "past", createdAt: "2025-01-01T00:00:00.000Z" }),
      row({ cohortId: "now", isCurrent: true, createdAt: "2026-01-01T00:00:00.000Z" }),
    ]);

    expect(defaultStudentCohortId(options)).toBe("now");
    expect(resolveStudentCohortId(options, "missing")).toBe("now");
    expect(resolveStudentCohortId(options, "past")).toBe("past");
  });

  it("uses the newest enrollment when no cohort is vigente", () => {
    const options = buildStudentCohortOptions([
      row({ cohortId: "older", createdAt: "2024-01-01T00:00:00.000Z" }),
      row({ cohortId: "newer", createdAt: "2025-01-01T00:00:00.000Z" }),
    ]);

    expect(defaultStudentCohortId(options)).toBe("newer");
  });

  it("keeps payments whose section is in the cohort and drops a null section", () => {
    const sectionIds = new Set(["section-1"]);
    const rows = filterPaymentsForCohort(
      [
        { id: "pay-1", section_id: "section-1" },
        { id: "pay-2", section_id: "section-9" },
        { id: "pay-3", section_id: null },
      ],
      sectionIds,
    );

    expect(rows.map((payment) => payment.id)).toEqual(["pay-1"]);
  });

  it("keeps the active enrollment when the same section appears twice", () => {
    const benefits = preferActiveSectionBenefits([
      {
        sectionId: "section-1",
        enrollmentStatus: "dropped",
        enrollmentCreatedAt: "2026-02-01T00:00:00.000Z",
      },
      {
        sectionId: "section-1",
        enrollmentStatus: "active",
        enrollmentCreatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        sectionId: "section-2",
        enrollmentStatus: "completed",
        enrollmentCreatedAt: "2025-01-01T00:00:00.000Z",
      },
    ]);

    expect(benefits.map((benefit) => benefit.sectionId)).toEqual(["section-1", "section-2"]);
    expect(benefits[0]?.enrollmentStatus).toBe("active");
  });
});
