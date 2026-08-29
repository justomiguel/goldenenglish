import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionLifecycleActions } from "@/components/organisms/AcademicSectionLifecycleActions";
import * as sectionArchiveActions from "@/app/[locale]/dashboard/admin/academic/sectionArchiveActions";

vi.mock("next/navigation", () => ({
  usePathname: () => "/es",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionArchiveActions", () => ({
  archiveAcademicSectionAction: vi.fn(),
  unarchiveAcademicSectionAction: vi.fn(),
  deleteAcademicSectionAction: vi.fn(),
  previewAcademicSectionDeleteAction: vi.fn(),
}));

const dict = {
  archivedBanner: "",
  cohortArchivedHint: "",
  archiveButton: "Archive section",
  unarchiveButton: "Restore section",
  deleteButton: "Delete permanently",
  modalArchiveTitle: "Archive?",
  modalArchiveBody: "Archive body",
  modalUnarchiveTitle: "Unarchive?",
  modalUnarchiveBody: "Unarchive body",
  modalDeleteTitle: "Delete?",
  modalDeleteBody: "Delete body",
  modalDeleteBodyWithEnrollments: "People are enrolled",
  enrollmentsListHeading: "Enrolled people",
  loadingEnrollments: "Loading enrollments",
  deleteConfirmCheckbox: "I understand",
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

describe("AcademicSectionLifecycleActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sectionArchiveActions.previewAcademicSectionDeleteAction).mockResolvedValue({
      ok: true,
      enrollments: [],
    });
  });

  it("shows archive and delete when the section is active", () => {
    render(
      <AcademicSectionLifecycleActions
        locale="en"
        sectionId="sec-1"
        sectionArchivedAt={null}
        cohortArchivedAt={null}
        dict={dict}
      />,
    );
    expect(screen.getByRole("button", { name: /archive section/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /delete permanently/i })).toBeVisible();
  });

  it("opens the archive modal from the toolbar", async () => {
    const user = userEvent.setup();
    render(
      <AcademicSectionLifecycleActions
        locale="en"
        sectionId="sec-1"
        sectionArchivedAt={null}
        cohortArchivedAt={null}
        dict={dict}
      />,
    );
    await user.click(screen.getByRole("button", { name: /archive section/i }));
    expect(screen.getByRole("heading", { name: /archive\?/i })).toBeVisible();
    expect(screen.getByText("Archive body")).toBeVisible();
  });
});

// ─── Group 4 (spec-8): variant contracts and delete gate ─────────────────────

describe("AcademicSectionLifecycleActions – spec-8 variant contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sectionArchiveActions.previewAcademicSectionDeleteAction).mockResolvedValue({
      ok: true,
      enrollments: [],
    });
  });

  it("archive button uses ghost variant (not loud)", () => {
    render(
      <AcademicSectionLifecycleActions
        locale="en"
        sectionId="sec-1"
        sectionArchivedAt={null}
        cohortArchivedAt={null}
        dict={dict}
      />,
    );
    const archiveBtn = screen.getByRole("button", { name: /archive section/i });
    // ghost = bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)]
    expect(archiveBtn.className).toContain("bg-transparent");
    // ghost does NOT have an error border
    expect(archiveBtn.className).not.toContain("--color-error");
  });

  it("unarchive button uses ghost variant when section is archived", () => {
    render(
      <AcademicSectionLifecycleActions
        locale="en"
        sectionId="sec-1"
        sectionArchivedAt="2025-01-01"
        cohortArchivedAt={null}
        dict={dict}
      />,
    );
    const unarchiveBtn = screen.getByRole("button", { name: /restore section/i });
    expect(unarchiveBtn.className).toContain("bg-transparent");
    expect(unarchiveBtn.className).not.toContain("--color-error");
  });

  it("delete button uses destructive variant (error border, no error text)", () => {
    render(
      <AcademicSectionLifecycleActions
        locale="en"
        sectionId="sec-1"
        sectionArchivedAt={null}
        cohortArchivedAt={null}
        dict={dict}
      />,
    );
    const deleteBtn = screen.getByRole("button", { name: /delete permanently/i });
    // destructive: error border present
    expect(deleteBtn.className).toContain("--color-error");
    // destructive: text-[var(--color-error)] must NOT be in className
    expect(deleteBtn.className).not.toMatch(/text-\[var\(--color-error\)\]/);
    // destructive: transparent background
    expect(deleteBtn.className).toContain("bg-transparent");
  });

  it("delete confirm button is disabled until the acknowledgement checkbox is checked", async () => {
    const user = userEvent.setup();
    render(
      <AcademicSectionLifecycleActions
        locale="en"
        sectionId="sec-1"
        sectionArchivedAt={null}
        cohortArchivedAt={null}
        dict={dict}
      />,
    );
    await user.click(screen.getByRole("button", { name: /delete permanently/i }));

    // Modal is open — find the confirm button inside the delete modal
    const confirmBtn = await screen.findByRole("button", { name: dict.confirm });
    expect(confirmBtn).toBeDisabled();

    // Check the acknowledgement checkbox
    const checkbox = screen.getByRole("checkbox", { name: dict.deleteConfirmCheckbox });
    await user.click(checkbox);
    expect(confirmBtn).not.toBeDisabled();
  });

  it("confirm button inside the delete dialog uses destructiveStrong variant", async () => {
    const user = userEvent.setup();
    render(
      <AcademicSectionLifecycleActions
        locale="en"
        sectionId="sec-1"
        sectionArchivedAt={null}
        cohortArchivedAt={null}
        dict={dict}
      />,
    );
    await user.click(screen.getByRole("button", { name: /delete permanently/i }));

    const confirmBtn = await screen.findByRole("button", { name: dict.confirm });
    // destructiveStrong: solid error background
    expect(confirmBtn.className).toContain("bg-[var(--color-error)]");
    expect(confirmBtn.className).toContain("text-white");
  });

  it("delete action is called when checkbox is checked and confirm is clicked", async () => {
    const mockDelete = vi.mocked(sectionArchiveActions.deleteAcademicSectionAction);
    mockDelete.mockResolvedValue({ ok: true, cohortId: "cohort-1" });
    const user = userEvent.setup();

    render(
      <AcademicSectionLifecycleActions
        locale="en"
        sectionId="sec-1"
        sectionArchivedAt={null}
        cohortArchivedAt={null}
        dict={dict}
      />,
    );
    await user.click(screen.getByRole("button", { name: /delete permanently/i }));
    const checkbox = screen.getByRole("checkbox", { name: dict.deleteConfirmCheckbox });
    await user.click(checkbox);
    const confirmBtn = screen.getByRole("button", { name: dict.confirm });
    await user.click(confirmBtn);

    expect(mockDelete).toHaveBeenCalledWith({ locale: "en", sectionId: "sec-1", force: false });
  });
});
