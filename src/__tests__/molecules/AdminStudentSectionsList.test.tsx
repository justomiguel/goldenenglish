// REGRESSION CHECK: section name and teacher name stay distinct links with their own labels.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminStudentSectionsList } from "@/components/molecules/AdminStudentSectionsList";
import { dictEn } from "@/test/dictEn";

const labels = dictEn.admin.users;

describe("AdminStudentSectionsList", () => {
  it("marks the section name and the teacher name with separate labels", () => {
    render(
      <AdminStudentSectionsList
        locale="es"
        cohortId="coh-1"
        sectionOptions={[]}
        labels={labels}
        busy={false}
        onRemove={() => undefined}
        sections={[
          {
            enrollmentId: "enr-1",
            sectionId: "sec-1",
            sectionName: "B1 Evening",
            teacher: { id: "teacher-1", name: "Hopper Grace" },
            assistants: [{ id: "assistant-1", name: "Lovelace Ada" }],
          },
        ]}
      />,
    );

    expect(screen.getByText(labels.detailSectionAssignSection)).toBeInTheDocument();
    expect(screen.getByText(labels.detailSectionAssignTeacher)).toBeInTheDocument();
    expect(screen.getByText(labels.detailSectionAssignAssistants)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "B1 Evening" })).toHaveAttribute(
      "href",
      "/es/dashboard/admin/academic/coh-1/sec-1",
    );
    expect(screen.getByRole("link", { name: "Hopper Grace" })).toHaveAttribute(
      "href",
      "/es/dashboard/admin/users/teacher-1",
    );
    expect(document.querySelectorAll("svg").length).toBeGreaterThanOrEqual(3);
  });
});
