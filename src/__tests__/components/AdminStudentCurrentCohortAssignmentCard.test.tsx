/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/dictionaries/en.json";
import { AdminStudentCurrentCohortAssignmentCard } from "@/components/molecules/AdminStudentCurrentCohortAssignmentCard";

const refresh = vi.fn();
const previewAction = vi.fn();
const addAction = vi.fn();
const removeAction = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/users/studentCurrentCohortSectionAssignmentActions", () => ({
  previewStudentCurrentCohortSectionAssignmentAction: (...a: unknown[]) => previewAction(...a),
  addStudentToSectionAction: (...a: unknown[]) => addAction(...a),
  removeStudentFromSectionAction: (...a: unknown[]) => removeAction(...a),
}));

const assignment = {
  cohortId: "cohort-1",
  cohortName: "2026",
  sections: [
    { id: "section-a", name: "A1", teacherName: "Ada", activeCount: 5, maxStudents: 12 },
    { id: "section-b", name: "B1", teacherName: "Grace", activeCount: 3, maxStudents: 12 },
    { id: "section-c", name: "C1", teacherName: "Emmy", activeCount: 7, maxStudents: 12 },
  ],
  current: { enrollmentId: "enrollment-b", sectionId: "section-b", sectionName: "B1" },
  currentSections: [
    { enrollmentId: "enrollment-b", sectionId: "section-b", sectionName: "B1" },
  ],
  hasMultipleCurrentAssignments: false,
};

describe("AdminStudentCurrentCohortAssignmentCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    previewAction.mockResolvedValue({ ok: true, parentPaymentsPending: false });
    addAction.mockResolvedValue({ ok: true, enrollmentId: "enrollment-a" });
    removeAction.mockResolvedValue({ ok: true });
  });

  it("shows current sections as a list", () => {
    render(
      <AdminStudentCurrentCohortAssignmentCard
        locale="en"
        studentId="student-1"
        labels={en.admin.users}
        assignment={assignment}
      />,
    );

    expect(screen.getByText("B1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Remove B1/i })).toBeInTheDocument();
  });

  it("adds the student to a new section", async () => {
    const user = userEvent.setup();
    render(
      <AdminStudentCurrentCohortAssignmentCard
        locale="en"
        studentId="student-1"
        labels={en.admin.users}
        assignment={assignment}
      />,
    );

    await user.selectOptions(screen.getByLabelText(en.admin.users.detailSectionAssignSelect), "section-a");
    await user.click(screen.getByRole("button", { name: en.admin.users.detailSectionAssignSubmit }));

    await waitFor(() => {
      expect(addAction).toHaveBeenCalledWith({
        locale: "en",
        studentId: "student-1",
        sectionId: "section-a",
        allowCapacityOverride: false,
      });
    });
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByText(en.admin.users.detailSectionAssignSaved)).toBeInTheDocument();
  });

  it("removes a student from a section after confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <AdminStudentCurrentCohortAssignmentCard
        locale="en"
        studentId="student-1"
        labels={en.admin.users}
        assignment={assignment}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Remove B1/i }));

    await waitFor(() => {
      expect(removeAction).toHaveBeenCalledWith({
        locale: "en",
        studentId: "student-1",
        enrollmentId: "enrollment-b",
      });
    });
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByText(en.admin.users.detailSectionAssignRemoved)).toBeInTheDocument();
  });

  it("does not show sections already assigned in the add dropdown", () => {
    render(
      <AdminStudentCurrentCohortAssignmentCard
        locale="en"
        studentId="student-1"
        labels={en.admin.users}
        assignment={assignment}
      />,
    );

    const select = screen.getByLabelText(en.admin.users.detailSectionAssignSelect) as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((o) => o.value);
    expect(optionValues).not.toContain("section-b");
    expect(optionValues).toContain("section-a");
    expect(optionValues).toContain("section-c");
  });
});
