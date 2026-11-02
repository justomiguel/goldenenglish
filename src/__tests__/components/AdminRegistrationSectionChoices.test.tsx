import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminRegistrationSectionChoices } from "@/components/dashboard/AdminRegistrationSectionChoices";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";

const sections: CurrentCohortSection[] = [
  { id: "s-web", name: "Web A", teacherName: "Ada", activeCount: 1, maxStudents: 10 },
  { id: "s-full", name: "Web Full", teacherName: "Ada", activeCount: 10, maxStudents: 10 },
];

const href = "/es/dashboard/admin/academic/cohort-web?tab=sections";

describe("AdminRegistrationSectionChoices", () => {
  it("lists open sections and still links to section creation", () => {
    render(
      <AdminRegistrationSectionChoices
        id="assign"
        sections={sections}
        sectionId=""
        onSectionId={vi.fn()}
        busy={false}
        assignLabel="Assign section"
        createHref={href}
        createLabel="Crear sección en Web 2026"
        emptyLabel="Esta cohorte no tiene secciones."
        onAssign={vi.fn()}
      />,
    );
    expect(screen.getByRole("option", { name: "Web A" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Web Full" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear sección en Web 2026" })).toHaveAttribute("href", href);
    expect(screen.queryByText("Esta cohorte no tiene secciones.")).not.toBeInTheDocument();
  });

  it("shows the empty legend and hides the select when the cohort has no sections", () => {
    render(
      <AdminRegistrationSectionChoices
        id="assign"
        sections={[]}
        sectionId=""
        onSectionId={vi.fn()}
        busy={false}
        assignLabel="Assign section"
        createHref={href}
        createLabel="Crear sección en Web 2026"
        emptyLabel="Esta cohorte no tiene secciones."
        onAssign={vi.fn()}
      />,
    );
    expect(screen.getByText("Esta cohorte no tiene secciones.")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Crear sección en Web 2026" });
    expect(link).toHaveAttribute("href", href);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
