import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { StudentDashboardEntry } from "@/components/student/StudentDashboardEntry";
import { ParentDashboardEntry } from "@/components/parent/ParentDashboardEntry";
import { ParentPaymentsEntry } from "@/components/parent/ParentPaymentsEntry";

vi.mock("@/components/student/AttendancePlayboard", () => ({
  AttendancePlayboard: () => <div data-testid="playboard" />,
}));

vi.mock("@/components/molecules/SurfaceMountGate", () => ({
  SurfaceMountGate: ({ desktop }: { desktop: React.ReactNode }) => <div>{desktop}</div>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/student/StudentMonthlyPaymentsStrip", () => ({
  StudentMonthlyPaymentsStrip: () => <div data-testid="payments-strip" />,
}));

vi.mock("@/components/student/StudentPaymentsHistory", () => ({
  StudentPaymentsHistory: () => <div data-testid="pay-history" />,
}));

describe("Tier A dashboard entries", () => {
  it("StudentDashboardEntry renders greeting hero with student name", () => {
    render(
      <StudentDashboardEntry
        locale="en"
        title="Student title"
        kicker="Student area"
        greeting="Good morning"
        fullDateLine="Monday, April 13, 2026"
        firstName="Lucia"
        engagementPoints={0}
        rows={[]}
        labels={dictEn.dashboard.student}
        hub={null}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Good morning, Lucia");
  });

  it("ParentDashboardEntry renders greeting hero with parent name", () => {
    render(
      <ParentDashboardEntry
        locale="es"
        title="Parent title"
        lead="Lead"
        kicker="Área familias"
        greeting="Buen día"
        fullDateLine="lunes, 13 de abril de 2026"
        firstName="Marta"
        navPay="Pay"
        payHref="/es/pay"
        kids={[{ id: "1", first_name: "A", last_name: "B" }]}
        parentLabels={dictEn.dashboard.parent}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Buen día, Marta");
  });

  it("ParentDashboardEntry renders family summary when summaries provided", () => {
    render(
      <ParentDashboardEntry
        locale="es"
        title="Familia"
        lead="Lead"
        kicker="Área familias"
        greeting="Buen día"
        fullDateLine="lunes, 13 de abril de 2026"
        firstName="Marta"
        navPay="Pagos"
        payHref="/es/dashboard/parent/payments"
        kids={[{ id: "s1", first_name: "Kid", last_name: "One" }]}
        summaries={[
          {
            studentId: "s1",
            firstName: "Kid",
            lastName: "One",
            attendancePercent: 90,
            levelLabel: "B1",
            nextExamAt: "2026-10-01",
            nextEventAt: null,
            nextEventLabel: null,
            assignedTeacherId: null,
            assignedTeacherName: null,
            lastPublishedGrade: null,
          },
        ]}
        selectedStudentId="s1"
        parentLabels={dictEn.dashboard.parent}
      />,
    );
    expect(screen.getByText("90%")).toBeInTheDocument();
  });

  it("ParentPaymentsEntry renders title", () => {
    render(
      <ParentPaymentsEntry
        locale="en"
        title="Payments"
        lead="Lead"
        options={[
          { studentId: "stu-1", displayName: "Kid", financialAccessActive: true },
        ]}
        selectedStudentId="stu-1"
        monthlyView={{ todayMonth: 1, todayYear: 2026, rows: [] }}
        payments={[]}
        financialAccessRevoked={false}
        labels={dictEn.dashboard.parent}
        studentLabels={dictEn.dashboard.student}
        submitReceiptAction={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Payments");
  });
});
