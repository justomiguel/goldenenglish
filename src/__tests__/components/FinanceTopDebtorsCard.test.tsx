import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { FinanceTopDebtorsCard } from "@/components/dashboard/admin/finance/FinanceTopDebtorsCard";
import type { CohortCollectionsMatrixSection } from "@/types/cohortCollectionsMatrix";
import type { SectionCollectionsStudentRow } from "@/types/sectionCollections";

const topDebtorsDict = dictEn.admin.finance.overview.topDebtors;

function makeStudent(
  id: string,
  name: string,
  overdue: number,
): SectionCollectionsStudentRow {
  return {
    studentId: id,
    studentName: name,
    documentLabel: null,
    enrolledAt: null,
    row: { months: [], sectionId: "sec-1", plans: [] } as unknown as SectionCollectionsStudentRow["row"],
    paid: 100,
    pendingReview: 0,
    overdue,
    upcoming: 0,
    expectedYear: 200,
    hasOverdue: overdue > 0,
    enrollmentFee: { amount: 0, expectedAmount: 0, exempt: false, exemptReason: null },
  };
}

function makeSections(students: SectionCollectionsStudentRow[]): CohortCollectionsMatrixSection[] {
  return [
    {
      archivedAt: null,
      view: {
        sectionId: "sec-1",
        sectionName: "Section A",
        cohortId: "cohort-1",
        cohortName: "2026",
        year: 2026,
        todayMonth: 4,
        sectionStartsOn: "2026-01-01",
        sectionEndsOn: "2026-12-31",
        students,
        kpis: {
          paid: 0,
          pendingReview: 0,
          overdue: 0,
          upcoming: 0,
          expectedYear: 0,
          collectionRatio: 0,
          totalStudents: students.length,
          overdueStudents: 0,
          health: "healthy",
        },
      },
    },
  ];
}

describe("FinanceTopDebtorsCard", () => {
  it("renders top 10 debtors sorted by overdue amount descending", () => {
    const students = [
      makeStudent("stu-1", "Smith Ana", 500),
      makeStudent("stu-2", "Lopez Zara", 1200),
      makeStudent("stu-3", "Garcia Leo", 300),
    ];
    render(
      <FinanceTopDebtorsCard
        sections={makeSections(students)}
        dict={topDebtorsDict}
        locale="en"
        currency="USD"
      />,
    );

    expect(screen.getByText(topDebtorsDict.title)).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);

    expect(items[0]).toHaveTextContent("Lopez Zara");
    expect(items[0]).toHaveTextContent("$1,200");
    expect(items[1]).toHaveTextContent("Smith Ana");
    expect(items[2]).toHaveTextContent("Garcia Leo");
  });

  it("shows empty state when no students have overdue amounts", () => {
    const students = [makeStudent("stu-1", "Smith Ana", 0)];
    render(
      <FinanceTopDebtorsCard
        sections={makeSections(students)}
        dict={topDebtorsDict}
        locale="en"
      />,
    );
    expect(screen.getByText(topDebtorsDict.empty)).toBeInTheDocument();
  });

  it("renders correct billing links for each debtor", () => {
    const students = [makeStudent("stu-1", "Smith Ana", 100)];
    render(
      <FinanceTopDebtorsCard
        sections={makeSections(students)}
        dict={topDebtorsDict}
        locale="en"
      />,
    );
    const link = screen.getByRole("link", { name: /Smith Ana/ });
    expect(link).toHaveAttribute("href", "/dashboard/admin/users/stu-1/billing");
  });
});
