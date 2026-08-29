import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionDeleteDialog } from "@/components/organisms/AcademicSectionDeleteDialog";
import * as sectionArchiveActions from "@/app/[locale]/dashboard/admin/academic/sectionArchiveActions";

vi.mock("next/navigation", () => ({
  usePathname: () => "/es",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionArchiveActions", () => ({
  deleteAcademicSectionAction: vi.fn(),
  previewAcademicSectionDeleteAction: vi.fn(),
}));

const dict = {
  archivedBanner: "",
  cohortArchivedHint: "",
  archiveButton: "Archive",
  unarchiveButton: "Restore",
  deleteButton: "Delete",
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

describe("AcademicSectionDeleteDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists enrolled people and force-deletes after acknowledgement", async () => {
    vi.mocked(sectionArchiveActions.previewAcademicSectionDeleteAction).mockResolvedValue({
      ok: true,
      enrollments: [
        { id: "e1", studentId: "s1", label: "García Luis", status: "active" },
        { id: "e2", studentId: "s2", label: "Pérez Ana", status: "dropped" },
      ],
    });
    const mockDelete = vi.mocked(sectionArchiveActions.deleteAcademicSectionAction);
    mockDelete.mockResolvedValue({ ok: true, cohortId: "c1" });
    const onDeleted = vi.fn();
    const user = userEvent.setup();

    render(
      <AcademicSectionDeleteDialog
        open
        onOpenChange={vi.fn()}
        locale="es"
        sectionId="sec-1"
        dict={dict}
        onDeleted={onDeleted}
      />,
    );

    expect(await screen.findByText("García Luis")).toBeVisible();
    expect(screen.getByText("Pérez Ana")).toBeVisible();
    expect(screen.getByText("These people are enrolled")).toBeVisible();
    expect(screen.getByText("People enrolled")).toBeVisible();
    expect(screen.getByText("Active")).toBeVisible();
    expect(screen.getByText("Dropped")).toBeVisible();

    const confirmBtn = screen.getByRole("button", { name: dict.confirm });
    expect(confirmBtn).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: dict.deleteConfirmCheckboxWithEnrollments }));
    expect(confirmBtn).not.toBeDisabled();

    await user.click(confirmBtn);
    expect(mockDelete).toHaveBeenCalledWith({ locale: "es", sectionId: "sec-1", force: true });
    expect(onDeleted).toHaveBeenCalledWith("c1");
  });

  it("uses the empty-section copy when nobody is enrolled", async () => {
    vi.mocked(sectionArchiveActions.previewAcademicSectionDeleteAction).mockResolvedValue({
      ok: true,
      enrollments: [],
    });

    render(
      <AcademicSectionDeleteDialog
        open
        onOpenChange={vi.fn()}
        locale="es"
        sectionId="sec-1"
        dict={dict}
        onDeleted={vi.fn()}
      />,
    );

    expect(await screen.findByText("Empty delete body")).toBeVisible();
    expect(screen.getByRole("checkbox", { name: dict.deleteConfirmCheckbox })).toBeVisible();
    expect(screen.queryByText("People enrolled")).not.toBeInTheDocument();
  });
});
