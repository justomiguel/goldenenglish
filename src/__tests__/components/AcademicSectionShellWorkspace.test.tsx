/**
 * Subject: AcademicSectionShellWorkspace — area lead icon sizing.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcademicSectionShellWorkspace } from "@/components/organisms/AcademicSectionShellWorkspace";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/academic/c/s",
}));

const labels = {
  hubAreasAria: "Areas",
  backToSection: "Back",
  areaSwitcherAria: "Switch",
  generalLead: "General",
  configuration: "Configuration",
  configurationLead: "Config lead",
  teachers: "Teachers",
  teachersLead: "Teachers lead text",
  learningRoute: "Route",
  learningRouteLead: "Route lead",
  evaluations: "Evaluations",
  evaluationsLead: "Evaluations lead",
  fees: "Fees",
  feesLead: "Fees lead",
  attendance: "Attendance",
  attendanceLead: "Attendance lead",
  students: "Students",
  studentsLead: "Students lead",
} as const;

describe("AcademicSectionShellWorkspace", () => {
  it("uses h-5 w-5 icon on area lead when an area is open", () => {
    const { container } = render(
      <AcademicSectionShellWorkspace
        labels={labels}
        featureFlags={{ requiresEvaluationsToPass: false, usesLearningRoute: false }}
        initialArea="teachers"
        hubOverview={<div />}
        configuration={<div />}
        teachers={<div data-testid="teachers-panel" />}
        learningRoute={null}
        evaluations={null}
        fees={<div />}
        attendance={<div />}
        students={<div />}
      />,
    );

    expect(screen.getByText("Teachers lead text")).toBeInTheDocument();
    const icon = container.querySelector("svg.h-5.w-5");
    expect(icon).toBeTruthy();
  });
});
