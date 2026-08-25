import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminFirstClassChecklistCard } from "@/components/dashboard/AdminFirstClassChecklistCard";
import { evaluateAdminFirstClassChecklist } from "@/lib/dashboard/evaluateAdminFirstClassChecklist";

const LABELS = {
  title: "Ready for the first class",
  lead: "Finish these steps to teach and collect fees.",
  progress: "{{done}} of {{total}}",
  goDoIt: "Go do it",
  goDoItAria: "Go do it: {{item}}",
  items: {
    createStudent: "Create a student",
    createTeacher: "Create a teacher",
    createCohortAndSection: "Create a cohort and a section",
    assignTeacher: "Assign a teacher to the section",
    enrollStudent: "Enroll a student in the section",
    setSchedule: "Set the section schedule",
    setFees: "Set section fees",
    setPaymentMethod: "Set up a payment method",
  },
};

const EMPTY = evaluateAdminFirstClassChecklist(
  {
    hasStudent: false,
    hasTeacher: false,
    hasCohort: false,
    hasSection: false,
    hasTeacherAssignedToSection: false,
    hasStudentEnrolledInSection: false,
    hasSectionSchedule: false,
    hasSectionFees: false,
    hasPaymentMethod: false,
  },
  "es",
);

describe("AdminFirstClassChecklistCard", () => {
  it("shows title, progress, and links incomplete items to their href", () => {
    render(<AdminFirstClassChecklistCard labels={LABELS} checklist={EMPTY} />);

    expect(screen.getByRole("heading", { name: LABELS.title })).toBeInTheDocument();
    expect(screen.getByText("0 of 8")).toBeInTheDocument();
    expect(screen.getByText(LABELS.items.createStudent)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go do it: Create a student" }),
    ).toHaveAttribute("href", "/es/dashboard/admin/users/new?role=student");
    expect(
      screen.getByRole("link", { name: "Go do it: Set up a payment method" }),
    ).toHaveAttribute("href", "/es/dashboard/admin/finance?tab=settings");
  });

  it("does not link completed items", () => {
    const checklist = evaluateAdminFirstClassChecklist(
      {
        hasStudent: true,
        hasTeacher: false,
        hasCohort: false,
        hasSection: false,
        hasTeacherAssignedToSection: false,
        hasStudentEnrolledInSection: false,
        hasSectionSchedule: false,
        hasSectionFees: false,
        hasPaymentMethod: false,
      },
      "es",
    );

    render(<AdminFirstClassChecklistCard labels={LABELS} checklist={checklist} />);

    expect(screen.getByText("1 of 8")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Go do it: Create a student" })).not.toBeInTheDocument();
    expect(screen.getByText(LABELS.items.createStudent)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go do it: Create a teacher" })).toBeInTheDocument();
  });
});
