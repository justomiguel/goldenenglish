import { describe, expect, it, vi } from "vitest";
import { loadAdminStudentDirectoryExtras } from "@/lib/dashboard/loadAdminStudentDirectoryExtras";

function thenable(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => resolve({ data, error: null }),
  };
}

describe("loadAdminStudentDirectoryExtras", () => {
  it("returns empty extras when there are no student ids", async () => {
    const from = vi.fn();
    const extras = await loadAdminStudentDirectoryExtras({ from } as never, []);
    expect(from).not.toHaveBeenCalled();
    expect(extras.sectionsByStudent.size).toBe(0);
    expect(extras.parentsByStudent.size).toBe(0);
    expect(extras.monthlyDueByStudent.size).toBe(0);
    expect(extras.billingFlagsByStudent.size).toBe(0);
  });

  it("groups sections, unique percents, and parent names by student", async () => {
    const studentId = "11111111-1111-1111-1111-111111111111";
    const parentId = "22222222-2222-2222-2222-222222222222";
    const from = vi.fn((table: string) => {
      if (table === "section_enrollments") {
        return thenable([
          {
            student_id: studentId,
            section_id: "sec-1",
            academic_sections: { name: "A1 Morning", cohort_id: "coh-1" },
          },
          {
            student_id: studentId,
            section_id: "sec-2",
            academic_sections: { name: "B1 Evening", cohort_id: "coh-1" },
          },
        ]);
      }
      if (table === "section_enrollment_scholarships") {
        return thenable([
          { student_id: studentId, section_id: "sec-1", discount_percent: 25 },
          { student_id: studentId, section_id: "sec-1", discount_percent: 10 },
        ]);
      }
      if (table === "tutor_student_rel") {
        return thenable([{ student_id: studentId, tutor_id: parentId }]);
      }
      if (table === "profiles") {
        return thenable([{ id: parentId, first_name: "Ana", last_name: "Padre" }]);
      }
      if (table === "section_fee_plans") {
        return thenable([
          {
            id: "p1",
            section_id: "sec-1",
            effective_from_year: 2026,
            effective_from_month: 1,
            monthly_fee: 120,
            currency: "USD",
            archived_at: null,
          },
          {
            id: "p2",
            section_id: "sec-2",
            effective_from_year: 2026,
            effective_from_month: 1,
            monthly_fee: 80,
            currency: "USD",
            archived_at: null,
          },
        ]);
      }
      if (table === "academic_sections") {
        return thenable([
          { id: "sec-1", billing_mode: "section_monthly_fee" },
          { id: "sec-2", billing_mode: "section_monthly_fee" },
        ]);
      }
      return thenable([]);
    });

    const extras = await loadAdminStudentDirectoryExtras(
      { from } as never,
      [studentId],
      new Date(2026, 7, 1),
    );

    expect(extras.sectionsByStudent.get(studentId)).toEqual([
      { id: "sec-1", name: "A1 Morning", cohortId: "coh-1", discountPercent: 25 },
      { id: "sec-2", name: "B1 Evening", cohortId: "coh-1", discountPercent: null },
    ]);
    expect(extras.parentsByStudent.get(studentId)).toEqual([
      { id: parentId, firstName: "Ana", lastName: "Padre" },
    ]);
    expect(extras.monthlyDueByStudent.get(studentId)).toEqual([{ amount: 170, currency: "USD" }]);
    expect(extras.billingFlagsByStudent.get(studentId)).toEqual({
      monthlyStatus: "na",
      enrollmentFeeStatus: "na",
      lastEnrollmentAt: null,
    });
  });
});
