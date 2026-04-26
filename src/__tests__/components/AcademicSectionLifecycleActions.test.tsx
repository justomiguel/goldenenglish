import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionLifecycleActions } from "@/components/organisms/AcademicSectionLifecycleActions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionArchiveActions", () => ({
  archiveAcademicSectionAction: vi.fn(),
  unarchiveAcademicSectionAction: vi.fn(),
  deleteAcademicSectionAction: vi.fn(),
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
  deleteConfirmCheckbox: "I understand",
  confirm: "Confirm",
  cancel: "Cancel",
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
