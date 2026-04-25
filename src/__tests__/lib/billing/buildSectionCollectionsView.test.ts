import { describe, expect, it } from "vitest";
import {
  buildSectionCollectionsView,
  toCohortCollectionsSectionSummary,
  type SectionCollectionsStudentInput,
} from "@/lib/billing/buildSectionCollectionsView";
import type { SectionFeePlan } from "@/types/sectionFeePlan";
import type { SectionScheduleSlot } from "@/types/academics";

// REGRESSION CHECK: changes to the per-section health derivation, the per-cell
// status mapping, or the aggregation of paid/overdue/upcoming may shift the
// admin "morosidad" view. Keep this test in sync with the public KPIs.

const PLAN: SectionFeePlan = {
  id: "plan-1",
  sectionId: "sec-1",
  effectiveFromYear: 2026,
  effectiveFromMonth: 1,
  monthlyFee: 100,
  currency: "USD",
  archivedAt: null,
};

// Section operates the entire calendar year; schedule with a single weekday is
// enough for KPI tests because every month has at least one occurrence.
const FULL_YEAR_SCHEDULE: SectionScheduleSlot[] = [
  { dayOfWeek: 2, startTime: "18:00", endTime: "19:30" },
];

function studentWithPayments(
  studentId: string,
  studentName: string,
  payments: SectionCollectionsStudentInput["payments"],
): SectionCollectionsStudentInput {
  return {
    studentId,
    studentName,
    documentLabel: `DOC-${studentId}`,
    scholarships: [],
    payments,
    enrolledAt: "2026-01-01",
  };
}

const SECTION_RANGE = {
  sectionStartsOn: "2026-01-01",
  sectionEndsOn: "2026-12-31",
  scheduleSlots: FULL_YEAR_SCHEDULE,
  sectionEnrollmentFeeAmount: 0,
} as const;

describe("buildSectionCollectionsView", () => {
  it("returns empty kpis and no rows when there are no students", () => {
    const view = buildSectionCollectionsView({
      sectionId: "sec-1",
      sectionName: "Section A",
      cohortId: "cohort-1",
      cohortName: "2026",
      todayYear: 2026,
      todayMonth: 6,
      plans: [PLAN],
      students: [],
      ...SECTION_RANGE,
    });
    expect(view.students).toEqual([]);
    expect(view.kpis.totalStudents).toBe(0);
    expect(view.kpis.overdueStudents).toBe(0);
    expect(view.kpis.collectionRatio).toBe(0);
    expect(view.kpis.health).toBe("watch");
  });

  it("flags health=critical when most students have overdue cells", () => {
    const today = { year: 2026, month: 6 };
    const students: SectionCollectionsStudentInput[] = [
      studentWithPayments("s1", "Ana", []),
      studentWithPayments("s2", "Bea", []),
      studentWithPayments("s3", "Cami", []),
    ];
    const view = buildSectionCollectionsView({
      sectionId: "sec-1",
      sectionName: "Section A",
      cohortId: "cohort-1",
      cohortName: "2026",
      todayYear: today.year,
      todayMonth: today.month,
      plans: [PLAN],
      students,
      ...SECTION_RANGE,
    });
    expect(view.kpis.totalStudents).toBe(3);
    expect(view.kpis.overdueStudents).toBe(3);
    // 3 students * 5 overdue months (Jan..May) * 100
    expect(view.kpis.overdue).toBe(1500);
    expect(view.kpis.upcoming).toBe(2100);
    expect(view.kpis.health).toBe("critical");
  });

  it("flags health=healthy when collection ratio >= 0.85 and no overdue", () => {
    const shortSection = {
      sectionStartsOn: "2026-01-01",
      sectionEndsOn: "2026-05-31",
      scheduleSlots: FULL_YEAR_SCHEDULE,
      sectionEnrollmentFeeAmount: 0,
    } as const;
    const payments = Array.from({ length: 12 }, (_, i) => ({
      id: `p${i + 1}`,
      sectionId: "sec-1",
      month: i + 1,
      year: 2026,
      amount: 100,
      status: "approved" as const,
      receiptSignedUrl: null,
    }));
    const view = buildSectionCollectionsView({
      sectionId: "sec-1",
      sectionName: "Section A",
      cohortId: "cohort-1",
      cohortName: "2026",
      todayYear: 2026,
      todayMonth: 12,
      plans: [PLAN],
      students: [studentWithPayments("s1", "Ana", payments)],
      ...shortSection,
    });
    expect(view.kpis.paid).toBe(1200);
    expect(view.kpis.expectedYear).toBe(1200);
    expect(view.kpis.overdueStudents).toBe(0);
    expect(view.kpis.collectionRatio).toBe(1);
    expect(view.kpis.health).toBe("healthy");
  });

  it("aggregates pending and upcoming separately", () => {
    const payments = [
      {
        id: "p-pending",
        sectionId: "sec-1",
        month: 6,
        year: 2026,
        amount: 100,
        status: "pending" as const,
        receiptSignedUrl: "https://signed/url",
      },
    ];
    const view = buildSectionCollectionsView({
      sectionId: "sec-1",
      sectionName: "Section A",
      cohortId: "cohort-1",
      cohortName: "2026",
      todayYear: 2026,
      todayMonth: 6,
      plans: [PLAN],
      students: [studentWithPayments("s1", "Ana", payments)],
      ...SECTION_RANGE,
    });
    // Pending cell sits at month 6 (today), so it counts as pending and stops
    // counting as upcoming for that month.
    expect(view.kpis.pendingReview).toBe(100);
    expect(view.kpis.overdue).toBe(500);
    expect(view.kpis.upcoming).toBe(600);
  });

  it("sorts students alphabetically by name", () => {
    const view = buildSectionCollectionsView({
      sectionId: "sec-1",
      sectionName: "Section A",
      cohortId: "cohort-1",
      cohortName: "2026",
      todayYear: 2026,
      todayMonth: 1,
      plans: [PLAN],
      students: [
        studentWithPayments("s1", "Zara", []),
        studentWithPayments("s2", "Ana", []),
        studentWithPayments("s3", "Mara", []),
      ],
      ...SECTION_RANGE,
    });
    expect(view.students.map((s) => s.studentName)).toEqual(["Ana", "Mara", "Zara"]);
  });

  it("includes the section enrollment fee in each student's expected total", () => {
    const view = buildSectionCollectionsView({
      sectionId: "sec-1",
      sectionName: "Section A",
      cohortId: "cohort-1",
      cohortName: "2026",
      todayYear: 2026,
      todayMonth: 12,
      plans: [PLAN],
      students: [studentWithPayments("s1", "Ana", [])],
      ...SECTION_RANGE,
      sectionEnrollmentFeeAmount: 150,
    });
    expect(view.students[0]!.expectedYear).toBe(1350);
    expect(view.kpis.expectedYear).toBe(1350);
  });

  it("does not count section enrollment fee for enrollment-fee-exempt students", () => {
    const view = buildSectionCollectionsView({
      sectionId: "sec-1",
      sectionName: "Section A",
      cohortId: "cohort-1",
      cohortName: "2026",
      todayYear: 2026,
      todayMonth: 12,
      plans: [PLAN],
      students: [
        {
          ...studentWithPayments("s1", "Ana", []),
          enrollmentFeeExempt: true,
          enrollmentExemptReason: "Staff grant",
        },
      ],
      ...SECTION_RANGE,
      sectionEnrollmentFeeAmount: 150,
    });

    expect(view.students[0]!.expectedYear).toBe(1200);
    expect(view.students[0]!.enrollmentFee.exempt).toBe(true);
    expect(view.students[0]!.enrollmentFee.expectedAmount).toBe(0);
    expect(view.kpis.expectedYear).toBe(1200);
  });

  it("does not count exempt monthly periods as expected or overdue", () => {
    const view = buildSectionCollectionsView({
      sectionId: "sec-1",
      sectionName: "Section A",
      cohortId: "cohort-1",
      cohortName: "2026",
      todayYear: 2026,
      todayMonth: 6,
      plans: [PLAN],
      students: [
        studentWithPayments("s1", "Ana", [
          {
            id: "exempt-jan",
            sectionId: "sec-1",
            month: 1,
            year: 2026,
            amount: 0,
            status: "exempt",
            receiptSignedUrl: null,
          },
        ]),
      ],
      ...SECTION_RANGE,
    });

    expect(view.students[0]!.row.cells[0]!.status).toBe("exempt");
    expect(view.students[0]!.expectedYear).toBe(1100);
    expect(view.students[0]!.overdue).toBe(400);
    expect(view.kpis.expectedYear).toBe(1100);
    expect(view.kpis.overdue).toBe(400);
  });

  it("marks active scholarship metadata for finance rows", () => {
    const view = buildSectionCollectionsView({
      sectionId: "sec-1",
      sectionName: "Section A",
      cohortId: "cohort-1",
      cohortName: "2026",
      todayYear: 2026,
      todayMonth: 12,
      plans: [PLAN],
      students: [
        {
          ...studentWithPayments("s1", "Ana", []),
          scholarships: [{
            discount_percent: 25,
            valid_from_year: 2026,
            valid_from_month: 1,
            valid_until_year: null,
            valid_until_month: null,
            is_active: true,
          }],
        },
      ],
      ...SECTION_RANGE,
    });

    expect(view.students[0]!.activeScholarshipDiscountPercent).toBe(25);
  });

  it("discounts finance expected totals when a scholarship is active", () => {
    const view = buildSectionCollectionsView({
      sectionId: "sec-1",
      sectionName: "Section A",
      cohortId: "cohort-1",
      cohortName: "2026",
      todayYear: 2026,
      todayMonth: 6,
      plans: [PLAN],
      students: [
        {
          ...studentWithPayments("s1", "Ana", []),
          scholarships: [{
            discount_percent: 50,
            valid_from_year: 2026,
            valid_from_month: 1,
            valid_until_year: null,
            valid_until_month: null,
            is_active: true,
          }],
        },
      ],
      ...SECTION_RANGE,
    });

    expect(view.students[0]!.expectedYear).toBe(600);
    expect(view.students[0]!.overdue).toBe(250);
    expect(view.kpis.expectedYear).toBe(600);
    expect(view.kpis.overdue).toBe(250);
  });

  it("uses the fee-plan year in admin totals, independent of enrolment day", () => {
    const view = buildSectionCollectionsView({
      sectionId: "sec-1",
      sectionName: "Section A",
      cohortId: "cohort-1",
      cohortName: "2026",
      todayYear: 2026,
      todayMonth: 12,
      plans: [{ ...PLAN, monthlyFee: 25 }],
      students: [
        studentWithPayments("s1", "Ana", []),
        { ...studentWithPayments("s2", "Bea", []), enrolledAt: "2026-04-25" },
      ],
      sectionStartsOn: "2026-03-03",
      sectionEndsOn: "2026-09-30",
      scheduleSlots: [{ dayOfWeek: 0, startTime: "13:00", endTime: "15:00" }],
      sectionEnrollmentFeeAmount: 150,
    });

    expect(view.students.map((s) => s.expectedYear)).toEqual([450, 450]);
    expect(view.kpis.expectedYear).toBe(900);
  });

  it("toCohortCollectionsSectionSummary copies kpis and archived flag", () => {
    const view = buildSectionCollectionsView({
      sectionId: "sec-1",
      sectionName: "Section A",
      cohortId: "cohort-1",
      cohortName: "2026",
      todayYear: 2026,
      todayMonth: 1,
      plans: [PLAN],
      students: [],
      ...SECTION_RANGE,
    });
    const summary = toCohortCollectionsSectionSummary(view, "2026-01-01");
    expect(summary.sectionId).toBe("sec-1");
    expect(summary.archivedAt).toBe("2026-01-01");
    expect(summary.kpis).toEqual(view.kpis);
  });
});
