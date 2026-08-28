import { describe, expect, it } from "vitest";
import { deriveAdminFirstClassChecklistFacts } from "@/lib/dashboard/deriveAdminFirstClassChecklistFacts";

const EMPTY_RAW = {
  studentCount: 0,
  teacherCount: 0,
  activeCohortCount: 0,
  sections: [] as Array<{
    teacherId: string | null;
    scheduleSlots: unknown;
    enrollmentFeeAmount: number | string | null;
    billingMode: string | null;
  }>,
  activeEnrollmentCount: 0,
  hasMonthlyFeePlan: false,
  hasClassPackPrice: false,
  bankTransferInstructions: null as string | null,
  enabledGatewayCount: 0,
};

describe("deriveAdminFirstClassChecklistFacts", () => {
  it("returns all false when the institute has no operational data", () => {
    expect(deriveAdminFirstClassChecklistFacts(EMPTY_RAW)).toEqual({
      hasStudent: false,
      hasTeacher: false,
      hasCohort: false,
      hasSection: false,
      hasTeacherAssignedToSection: false,
      hasStudentEnrolledInSection: false,
      hasSectionSchedule: false,
      hasSectionFees: false,
      hasPaymentMethod: false,
    });
  });

  it("maps people, containers, assignment, and enrollment counts", () => {
    const facts = deriveAdminFirstClassChecklistFacts({
      ...EMPTY_RAW,
      studentCount: 1,
      teacherCount: 2,
      activeCohortCount: 1,
      sections: [
        {
          teacherId: "t1",
          scheduleSlots: [],
          enrollmentFeeAmount: 0,
          billingMode: "section_monthly_fee",
        },
      ],
      activeEnrollmentCount: 1,
    });

    expect(facts.hasStudent).toBe(true);
    expect(facts.hasTeacher).toBe(true);
    expect(facts.hasCohort).toBe(true);
    expect(facts.hasSection).toBe(true);
    expect(facts.hasTeacherAssignedToSection).toBe(true);
    expect(facts.hasStudentEnrolledInSection).toBe(true);
    expect(facts.hasSectionSchedule).toBe(false);
  });

  it("treats a valid schedule slot as a configured timetable", () => {
    const facts = deriveAdminFirstClassChecklistFacts({
      ...EMPTY_RAW,
      sections: [
        {
          teacherId: null,
          scheduleSlots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }],
          enrollmentFeeAmount: 0,
          billingMode: "section_monthly_fee",
        },
      ],
    });
    expect(facts.hasSectionSchedule).toBe(true);
  });

  it("treats enrollment fee, monthly plan, or class-pack prices as fees", () => {
    const byEnrollment = deriveAdminFirstClassChecklistFacts({
      ...EMPTY_RAW,
      sections: [
        {
          teacherId: null,
          scheduleSlots: [],
          enrollmentFeeAmount: "150",
          billingMode: "section_monthly_fee",
        },
      ],
    });
    const byMonthly = deriveAdminFirstClassChecklistFacts({
      ...EMPTY_RAW,
      hasMonthlyFeePlan: true,
    });
    const packWithoutPrice = deriveAdminFirstClassChecklistFacts({
      ...EMPTY_RAW,
      sections: [
        {
          teacherId: null,
          scheduleSlots: [],
          enrollmentFeeAmount: 0,
          billingMode: "class_pack",
        },
      ],
    });
    const packWithPrice = deriveAdminFirstClassChecklistFacts({
      ...EMPTY_RAW,
      sections: [
        {
          teacherId: null,
          scheduleSlots: [],
          enrollmentFeeAmount: 0,
          billingMode: "class_pack",
        },
      ],
      hasClassPackPrice: true,
    });

    expect(byEnrollment.hasSectionFees).toBe(true);
    expect(byMonthly.hasSectionFees).toBe(true);
    expect(packWithoutPrice.hasSectionFees).toBe(false);
    expect(packWithPrice.hasSectionFees).toBe(true);
  });

  it("treats a stored-null enrollment plus a cohort default as configured fees", () => {
    const inherited = deriveAdminFirstClassChecklistFacts({
      ...EMPTY_RAW,
      sections: [
        {
          teacherId: null,
          scheduleSlots: [],
          enrollmentFeeAmount: null,
          billingMode: "section_monthly_fee",
          cohortDefaultEnrollmentFeeAmount: 200,
        },
      ],
    });
    const storedZero = deriveAdminFirstClassChecklistFacts({
      ...EMPTY_RAW,
      sections: [
        {
          teacherId: null,
          scheduleSlots: [],
          enrollmentFeeAmount: 0,
          billingMode: "section_monthly_fee",
          cohortDefaultEnrollmentFeeAmount: 200,
        },
      ],
    });
    expect(inherited.hasSectionFees).toBe(true);
    expect(storedZero.hasSectionFees).toBe(false);
  });

  it("treats bank transfer copy or an enabled gateway as a payment method", () => {
    const blankTransfer = deriveAdminFirstClassChecklistFacts({
      ...EMPTY_RAW,
      bankTransferInstructions: "   ",
    });
    const transfer = deriveAdminFirstClassChecklistFacts({
      ...EMPTY_RAW,
      bankTransferInstructions: "Banco Estado · 123",
    });
    const gateway = deriveAdminFirstClassChecklistFacts({
      ...EMPTY_RAW,
      enabledGatewayCount: 1,
    });

    expect(blankTransfer.hasPaymentMethod).toBe(false);
    expect(transfer.hasPaymentMethod).toBe(true);
    expect(gateway.hasPaymentMethod).toBe(true);
  });
});
