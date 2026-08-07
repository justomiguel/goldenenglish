import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParentDashboardFamilyView } from "@/components/parent/ParentDashboardFamilyView";
import { ParentHubBillingCard } from "@/components/parent/ParentHubBillingCard";
import { dictEn } from "@/test/dictEn";

const SUMMARIES = [
  {
    studentId: "a",
    firstName: "Uno",
    lastName: "X",
    attendancePercent: 80,
    levelLabel: "A2",
    nextExamAt: "2026-09-01",
    nextEventAt: "2026-09-02T10:00:00.000Z",
    nextEventLabel: "Examen oral",
    assignedTeacherId: null,
    assignedTeacherName: null,
    lastPublishedGrade: null,
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
    assignedTeacherId: null,
    assignedTeacherName: null,
    lastPublishedGrade: null,
  },
];

describe("ParentDashboardFamilyView", () => {
  it("renders switcher and summary for two children", () => {
    render(
      <ParentDashboardFamilyView
        locale="es"
        summaries={SUMMARIES}
        selectedStudentId="a"
        navPay="Pagos"
        payHrefBase="/es/dashboard/parent/payments"
        labels={dictEn.dashboard.parent}
      />,
    );
    expect(screen.getAllByText(/X\s+Uno/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Pagos/i })).toHaveAttribute(
      "href",
      "/es/dashboard/parent/payments?studentId=a",
    );
  });

  it("child switcher links use studentId parameter", () => {
    render(
      <ParentDashboardFamilyView
        locale="es"
        summaries={SUMMARIES}
        selectedStudentId="a"
        navPay="Pagos"
        payHrefBase="/es/dashboard/parent/payments"
        labels={dictEn.dashboard.parent}
      />,
    );
    const switcherLinks = screen
      .getAllByRole("link")
      .filter((l) => (l.getAttribute("href") ?? "").includes("/dashboard/parent?"));
    expect(switcherLinks.length).toBeGreaterThan(0);
    for (const link of switcherLinks) {
      expect(link.getAttribute("href")).toContain("studentId=");
      expect(link.getAttribute("href")).not.toContain("child=");
    }
  });
});

describe("ParentHubBillingCard", () => {
  it("links to payments with studentId, not child", () => {
    render(
      <ParentHubBillingCard
        locale="es"
        studentId="a"
        pending={false}
        payHrefBase="/es/dashboard/parent/payments"
        dict={dictEn.dashboard.parent.hub}
      />,
    );
    const payLink = screen.getByRole("link", { name: dictEn.dashboard.parent.hub.billingPayCta });
    expect(payLink).toHaveAttribute(
      "href",
      "/es/dashboard/parent/payments?studentId=a",
    );
  });
});
