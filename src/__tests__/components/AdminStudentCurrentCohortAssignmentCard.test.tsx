/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/dictionaries/en.json";
import { AdminStudentCurrentCohortAssignmentCard } from "@/components/molecules/AdminStudentCurrentCohortAssignmentCard";

const refresh = vi.fn();
const previewAction = vi.fn();
const assignAction = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/users/studentCurrentCohortSectionAssignmentActions", () => ({
  previewStudentCurrentCohortSectionAssignmentAction: (...a: unknown[]) => previewAction(...a),
  assignStudentToCurrentCohortSectionAction: (...a: unknown[]) => assignAction(...a),
}));

const assignment = {
  cohortId: "cohort-1",
  cohortName: "2026",
  sections: [
    { id: "section-a", name: "A1", teacherName: "Ada", activeCount: 5, maxStudents: 12 },
    { id: "section-b", name: "B1", teacherName: "Grace", activeCount: 3, maxStudents: 12 },
  ],
  current: { enrollmentId: "enrollment-b", sectionId: "section-b", sectionName: "B1" },
  hasMultipleCurrentAssignments: false,
};

describe("AdminStudentCurrentCohortAssignmentCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    previewAction.mockResolvedValue({ ok: true, parentPaymentsPending: false });
    assignAction.mockResolvedValue({ ok: true, enrollmentId: "enrollment-a" });
  });

  // REGRESSION CHECK: The profile card must call the scoped profile action,
  // not the generic academic enrollment action, so the server owns current
  // cohort validation and duplicate-current-enrollment prevention.
  it("assigns the student to a selected current-cohort section", async () => {
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
      expect(assignAction).toHaveBeenCalledWith({
        locale: "en",
        studentId: "student-1",
        sectionId: "section-a",
        allowCapacityOverride: false,
      });
    });
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByText(en.admin.users.detailSectionAssignSaved)).toBeInTheDocument();
  });
});
