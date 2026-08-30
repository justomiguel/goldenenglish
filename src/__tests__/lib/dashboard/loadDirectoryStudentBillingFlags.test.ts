import { describe, expect, it, vi } from "vitest";
import { loadDirectoryStudentBillingFlags } from "@/lib/dashboard/loadDirectoryStudentBillingFlags";

function thenable(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => resolve({ data, error: null }),
  };
}

describe("loadDirectoryStudentBillingFlags", () => {
  it("returns an empty map and does not query when there are no students", async () => {
    const from = vi.fn();
    const flags = await loadDirectoryStudentBillingFlags({ from } as never, []);
    expect(from).not.toHaveBeenCalled();
    expect(flags.size).toBe(0);
  });

  it("sets last enrollment and unpaid matrícula from active enrollments", async () => {
    const studentId = "11111111-1111-1111-1111-111111111111";
    const from = vi.fn((table: string) => {
      if (table === "section_enrollments") {
        return thenable([
          {
            id: "enr-1",
            student_id: studentId,
            section_id: "sec-1",
            created_at: "2026-08-10T00:00:00.000Z",
            enrollment_fee_exempt: false,
            enrollment_fee_receipt_status: null,
            last_enrollment_paid_at: null,
            academic_sections: {
              id: "sec-1",
              name: "A1",
              starts_on: "2026-08-01",
              ends_on: "2026-12-01",
              schedule_slots: [],
              enrollment_fee_amount: 80,
              monthly_fee_charge_mode: "full_month",
              allow_advance_monthly_payment: false,
              academic_cohorts: { name: "2026", default_enrollment_fee_amount: null, default_monthly_fee: null },
            },
          },
        ]);
      }
      return thenable([]);
    });

    const flags = await loadDirectoryStudentBillingFlags({ from } as never, [studentId], new Date(2026, 7, 15));
    expect(flags.get(studentId)?.lastEnrollmentAt).toBe("2026-08-10T00:00:00.000Z");
    expect(flags.get(studentId)?.enrollmentFeeStatus).toBe("no");
  });
});
