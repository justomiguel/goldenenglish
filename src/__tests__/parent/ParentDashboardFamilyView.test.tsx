import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParentDashboardFamilyView } from "@/components/parent/ParentDashboardFamilyView";
import { dictEn } from "@/test/dictEn";

describe("ParentDashboardFamilyView", () => {
  it("renders switcher and summary for two children", () => {
    render(
      <ParentDashboardFamilyView
        locale="es"
        summaries={[
          {
            studentId: "a",
            firstName: "Uno",
            lastName: "X",
            attendancePercent: 80,
            levelLabel: "A2",
            nextExamAt: "2026-09-01",
            nextEventAt: "2026-09-02T10:00:00.000Z",
            nextEventLabel: "Examen oral",
          },
          {
            studentId: "b",
            firstName: "Dos",
            lastName: "Y",
            attendancePercent: null,
            levelLabel: null,
            nextExamAt: null,
            nextEventAt: null,
            nextEventLabel: null,
          },
        ]}
        selectedStudentId="a"
        navPay="Pagos"
        payHrefBase="/es/dashboard/parent/payments"
        labels={dictEn.dashboard.parent}
      />,
    );
    expect(screen.getAllByText(/Uno\s+X/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Pagos/i })).toHaveAttribute(
      "href",
      "/es/dashboard/parent/payments?child=a",
    );
  });
});
