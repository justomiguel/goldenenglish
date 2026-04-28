import { describe, expect, it } from "vitest";
import {
  mapScholarship,
  sectionEnrollmentMeta,
  sectionNameFromEnrollment,
  sectionScheduleSlotsAndCohort,
} from "@/lib/dashboard/loadAdminStudentBillingTabDataMappers";
import type { EnrollmentBenefitRow } from "@/lib/dashboard/loadAdminStudentBillingTabDataMappers";

describe("loadAdminStudentBillingTabDataMappers", () => {
  it("maps scholarship row", () => {
    const s = mapScholarship({
      id: "1",
      enrollment_id: "e",
      discount_percent: 15,
      note: "n",
      valid_from_year: 2026,
      valid_from_month: 1,
      valid_until_year: 2026,
      valid_until_month: 12,
      is_active: true,
    });
    expect(s.discount_percent).toBe(15);
    expect(s.is_active).toBe(true);
  });

  it("reads section name and enrollment window from nested section", () => {
    const row: EnrollmentBenefitRow = {
      id: "e1",
      section_id: "sec",
      created_at: null,
      enrollment_fee_exempt: false,
      enrollment_exempt_reason: null,
      last_enrollment_paid_at: null,
      academic_sections: {
        name: "S1",
        enrollment_fee_amount: 100,
        starts_on: "2026-01-15",
        ends_on: "2026-12-20",
        schedule_slots: [],
        academic_cohorts: { name: "C1" },
      },
    };
    expect(sectionNameFromEnrollment(row)).toBe("S1");
    expect(sectionEnrollmentMeta(row).sectionEnrollmentFeeAmount).toBe(100);
    expect(sectionScheduleSlotsAndCohort(row).cohortName).toBe("C1");
  });
});
