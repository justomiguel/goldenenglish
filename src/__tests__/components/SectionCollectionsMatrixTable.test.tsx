import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SectionCollectionsMatrixTable } from "@/components/dashboard/admin/finance/SectionCollectionsMatrixTable";
import { dictEn } from "@/test/dictEn";
import type {
  SectionCollectionsView,
  SectionCollectionsStudentRow,
} from "@/types/sectionCollections";

const collectionsDict = dictEn.admin.finance.collections;

function buildStudent(
  id: string,
  name: string,
  hasOverdue: boolean,
): SectionCollectionsStudentRow {
  return {
    studentId: id,
    studentName: name,
    documentLabel: id === "s1" ? "DNI 123" : null,
    paid: 0,
    pendingReview: 0,
    overdue: hasOverdue ? 100 : 0,
    upcoming: 0,
    expectedYear: 1200,
    hasOverdue,
    row: {
      sectionId: "sec-1",
      sectionName: "S1",
      cohortName: "Cohort 2026",
      hasActivePlan: true,
      enrollmentFeeAmount: 0,
      enrollmentFeeExempt: false,
      enrollmentFeeExemptReason: null,
      enrollmentFeeCurrency: null,
      currentPlan: null,
      cells: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        year: 2026,
        status: hasOverdue && i + 1 < 6 ? "due" : "approved",
        expectedAmount: 100,
        fullMonthExpectedAmount: 100,
        currency: "USD",
        proration: null,
        recordedAmount: 100,
        paymentId: null,
        receiptSignedUrl: null,
        isCurrent: i + 1 === 6,
      })),
    },
  };
}

const baseView: SectionCollectionsView = {
  sectionId: "sec-1",
  sectionName: "S1",
  cohortId: "co-1",
  cohortName: "Cohort 2026",
  year: 2026,
  todayMonth: 6,
  students: [buildStudent("s1", "Ada", true), buildStudent("s2", "Bea", false)],
  kpis: {
    paid: 0,
    pendingReview: 0,
    overdue: 100,
    upcoming: 0,
    expectedYear: 2400,
    collectionRatio: 0,
    totalStudents: 2,
    overdueStudents: 1,
    health: "watch",
  },
};

describe("SectionCollectionsMatrixTable", () => {
  it("renders student rows with month columns and totals", () => {
    render(
      <SectionCollectionsMatrixTable
        view={baseView}
        dict={collectionsDict}
        locale="en"
        selectedIds={new Set()}
        onToggleStudent={() => undefined}
        onToggleAll={() => undefined}
      />,
    );
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByText("Bea")).toBeInTheDocument();
    expect(screen.getByText("DNI 123")).toBeInTheDocument();
    expect(screen.getByText(collectionsDict.matrix.studentColumn)).toBeInTheDocument();
    expect(
      screen.getAllByLabelText(/Unpaid.*Expected amount/i).length,
    ).toBeGreaterThan(0);
  });

  it("invokes onToggleStudent when a row checkbox changes", () => {
    const onToggleStudent = vi.fn();
    render(
      <SectionCollectionsMatrixTable
        view={baseView}
        dict={collectionsDict}
        locale="en"
        selectedIds={new Set()}
        onToggleStudent={onToggleStudent}
        onToggleAll={() => undefined}
      />,
    );
    const cb = screen.getByLabelText(
      collectionsDict.matrix.selectStudentAria.replace("{name}", "Ada"),
    );
    fireEvent.click(cb);
    expect(onToggleStudent).toHaveBeenCalledWith("s1", true);
  });

  it("invokes onToggleAll when the header checkbox changes", () => {
    const onToggleAll = vi.fn();
    render(
      <SectionCollectionsMatrixTable
        view={baseView}
        dict={collectionsDict}
        locale="en"
        selectedIds={new Set()}
        onToggleStudent={() => undefined}
        onToggleAll={onToggleAll}
      />,
    );
    fireEvent.click(screen.getByLabelText(collectionsDict.matrix.selectAllAria));
    expect(onToggleAll).toHaveBeenCalledWith(true);
  });

  it("shows the empty state message when there are no students", () => {
    render(
      <SectionCollectionsMatrixTable
        view={{ ...baseView, students: [] }}
        dict={collectionsDict}
        locale="en"
        selectedIds={new Set()}
        onToggleStudent={() => undefined}
        onToggleAll={() => undefined}
      />,
    );
    expect(screen.getByText(collectionsDict.matrix.empty)).toBeInTheDocument();
  });
});
