import { describe, expect, it, vi } from "vitest";
import { loadAdminParentDirectoryExtras } from "@/lib/dashboard/loadAdminParentDirectoryExtras";

function thenable(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => resolve({ data, error: null }),
  };
}

describe("loadAdminParentDirectoryExtras", () => {
  it("returns empty maps when there are no parent ids", async () => {
    const from = vi.fn();
    const extras = await loadAdminParentDirectoryExtras({ from } as never, []);
    expect(from).not.toHaveBeenCalled();
    expect(extras.childrenByParent.size).toBe(0);
    expect(extras.sectionsByParent.size).toBe(0);
    expect(extras.billingFlagsByParent.size).toBe(0);
  });

  it("groups children and distinct active sections by parent", async () => {
    const parentId = "11111111-1111-1111-1111-111111111111";
    const studentId = "22222222-2222-2222-2222-222222222222";
    const from = vi.fn((table: string) => {
      if (table === "tutor_student_rel") {
        return thenable([{ tutor_id: parentId, student_id: studentId }]);
      }
      if (table === "profiles") {
        return thenable([{ id: studentId, first_name: "Lina", last_name: "Alumno" }]);
      }
      if (table === "section_enrollments") {
        return thenable([
          {
            student_id: studentId,
            section_id: "sec-1",
            academic_sections: { name: "A1 Morning", cohort_id: "coh-1" },
          },
          {
            student_id: studentId,
            section_id: "sec-1",
            academic_sections: { name: "A1 Morning", cohort_id: "coh-1" },
          },
        ]);
      }
      return thenable([]);
    });

    const extras = await loadAdminParentDirectoryExtras({ from } as never, [parentId]);
    expect(extras.childrenByParent.get(parentId)).toEqual([
      { id: studentId, firstName: "Lina", lastName: "Alumno" },
    ]);
    expect(extras.sectionsByParent.get(parentId)).toEqual([
      { id: "sec-1", name: "A1 Morning", cohortId: "coh-1", discountPercent: null },
    ]);
    expect(extras.billingFlagsByParent.get(parentId)).toEqual({
      monthlyStatus: "na",
      enrollmentFeeStatus: "na",
      lastEnrollmentAt: null,
    });
  });
});
