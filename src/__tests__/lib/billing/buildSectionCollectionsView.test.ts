import { describe, expect, it } from "vitest";
import {
  buildSectionCollectionsView,
  toCohortCollectionsSectionSummary,
  type SectionCollectionsStudentInput,
} from "@/lib/billing/buildSectionCollectionsView";
import type { SectionFeePlan } from "@/types/sectionFeePlan";

// REGRESSION CHECK: changes to the per-section health derivation, the per-cell
// status mapping, or the aggregation of paid/overdue/upcoming may shift the
// admin "morosidad" view. Keep this test in sync with the public KPIs.

const PLAN: SectionFeePlan = {
  id: "plan-1",
  sectionId: "sec-1",
  effectiveFromYear: 2026,
  effectiveFromMonth: 1,
  monthlyFee: 100,
  paymentsCount: 12,
  chargesEnrollmentFee: false,
  periodStartYear: 2026,
  periodStartMonth: 1,
  archivedAt: null,
};

function studentWithPayments(
  studentId: string,
  studentName: string,
  payments: SectionCollectionsStudentInput["payments"],
): SectionCollectionsStudentInput {
  return {
    studentId,
    studentName,
    documentLabel: `DOC-${studentId}`,
    scholarship: null,
    payments,
  };
}

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
    });
    expect(view.kpis.totalStudents).toBe(3);
    expect(view.kpis.overdueStudents).toBe(3);
    // 3 students * 5 overdue months (Jan..May) * 100
    expect(view.kpis.overdue).toBe(1500);
    expect(view.kpis.upcoming).toBe(2100);
    expect(view.kpis.health).toBe("critical");
  });

  it("flags health=healthy when collection ratio >= 0.85 and no overdue", () => {
    const shortPlan = { ...PLAN, paymentsCount: 5 };
    const payments = Array.from({ length: 5 }, (_, i) => ({
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
      plans: [shortPlan],
      students: [studentWithPayments("s1", "Ana", payments)],
    });
    expect(view.kpis.paid).toBe(500);
    expect(view.kpis.expectedYear).toBe(500);
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
    });
    expect(view.students.map((s) => s.studentName)).toEqual(["Ana", "Mara", "Zara"]);
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
    });
    const summary = toCohortCollectionsSectionSummary(view, "2026-01-01");
    expect(summary.sectionId).toBe("sec-1");
    expect(summary.archivedAt).toBe("2026-01-01");
    expect(summary.kpis).toEqual(view.kpis);
  });
});
