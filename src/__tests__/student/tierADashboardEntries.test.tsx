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
        title="Student title"
        rows={[]}
        labels={dictEn.dashboard.student}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Student title");
  });

  it("ParentDashboardEntry renders title", () => {
    render(
      <ParentDashboardEntry
        title="Parent title"
        lead="Lead"
        navPay="Pay"
        payHref="/es/pay"
        kids={[{ id: "1", first_name: "A", last_name: "B" }]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Parent title");
  });

  it("ParentPaymentsEntry renders title", () => {
    render(
      <ParentPaymentsEntry
        title="Payments"
        lead="Lead"
        options={[{ id: "1", label: "Kid" }]}
        labels={dictEn.dashboard.parent}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Payments");
  });
});
