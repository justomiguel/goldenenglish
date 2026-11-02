import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminRegistrationSectionChoices } from "@/components/dashboard/AdminRegistrationSectionChoices";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";

const sections: CurrentCohortSection[] = [
  { id: "s-web", name: "Web A", teacherName: "Ada", activeCount: 1, maxStudents: 10 },
  { id: "s-full", name: "Web Full", teacherName: "Ada", activeCount: 10, maxStudents: 10 },
];

describe("AdminRegistrationSectionChoices", () => {
  it("lists only open sections from the given cohort list", () => {
    render(
      <AdminRegistrationSectionChoices
        id="assign"
        sections={sections}
        sectionId=""
        onSectionId={vi.fn()}
        busy={false}
        assignLabel="Assign section"
        onAssign={vi.fn()}
      />,
    );
    expect(screen.getByRole("option", { name: "Web A" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Web Full" })).not.toBeInTheDocument();
  });

  it("links to cohort section creation when the cohort has no sections", () => {
    render(
      <AdminRegistrationSectionChoices
        id="assign"
        sections={[]}
        sectionId=""
        onSectionId={vi.fn()}
        busy={false}
        assignLabel="Assign section"
        createHref="/es/dashboard/admin/academic/cohort-web"
        createLabel="Crear sección en la cohorte"
        onAssign={vi.fn()}
      />,
    );
    const link = screen.getByRole("link", { name: "Crear sección en la cohorte" });
    expect(link).toHaveAttribute("href", "/es/dashboard/admin/academic/cohort-web");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
