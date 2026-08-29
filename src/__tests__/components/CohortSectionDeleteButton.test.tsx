import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CohortSectionDeleteButton } from "@/components/molecules/CohortSectionDeleteButton";

vi.mock("next/navigation", () => ({
  usePathname: () => "/es",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionArchiveActions", () => ({
  deleteAcademicSectionAction: vi.fn(),
  previewAcademicSectionDeleteAction: vi.fn().mockResolvedValue({ ok: true, enrollments: [] }),
}));

const dict = {
  archivedBanner: "",
  cohortArchivedHint: "",
  archiveButton: "Archive",
  unarchiveButton: "Restore",
  deleteButton: "Delete permanently",
  modalArchiveTitle: "",
  modalArchiveBody: "",
  modalUnarchiveTitle: "",
  modalUnarchiveBody: "",
  modalDeleteTitle: "Delete this section?",
  modalDeleteBody: "Empty delete body",
  modalDeleteBodyWithEnrollments: "These people are enrolled",
  enrollmentsListHeading: "People enrolled",
  loadingEnrollments: "Loading enrollments",
  deleteConfirmCheckbox: "I understand empty",
  deleteConfirmCheckboxWithEnrollments: "I understand they are enrolled",
  deleteButtonAria: "Delete section {name}",
  confirm: "Confirm",
  cancel: "Cancel",
  enrollmentStatus: {
    active: "Active",
    dropped: "Dropped",
    transferred: "Transferred",
    completed: "Completed",
  },
  errors: {
    active_enrollments: "Has enrollments",
    cohort_archived: "Cohort archived",
    enrollments_exist: "Enrollments exist",
    save: "Save failed",
    parse: "Parse failed",
  },
};

describe("CohortSectionDeleteButton", () => {
  it("opens the delete dialog from the cohort card without navigating", async () => {
    const user = userEvent.setup();
    render(
      <CohortSectionDeleteButton
        locale="es"
        sectionId="sec-1"
        sectionName="A1 Mañana"
        dict={dict}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete section A1 Mañana" }));
    expect(await screen.findByRole("heading", { name: /delete this section/i })).toBeVisible();
  });
});
