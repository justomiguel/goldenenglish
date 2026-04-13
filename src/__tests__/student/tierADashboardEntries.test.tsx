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

describe("Tier A dashboard entries", () => {
  it("StudentDashboardEntry renders title", () => {
    render(
      <StudentDashboardEntry
        locale="en"
        title="Student title"
        engagementPoints={0}
        rows={[]}
        labels={dictEn.dashboard.student}
        hub={null}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Student title");
  });

  it("ParentDashboardEntry renders title", () => {
    render(
      <ParentDashboardEntry
        locale="es"
        title="Parent title"
        lead="Lead"
        navPay="Pay"
        payHref="/es/pay"
        kids={[{ id: "1", first_name: "A", last_name: "B" }]}
        parentLabels={dictEn.dashboard.parent}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Parent title");
  });

  it("ParentDashboardEntry renders family summary when summaries provided", () => {
    render(
      <ParentDashboardEntry
        locale="es"
        title="Familia"
        lead="Lead"
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
        options={[{ id: "1", label: "Kid" }]}
        labels={dictEn.dashboard.parent}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Payments");
  });
});
