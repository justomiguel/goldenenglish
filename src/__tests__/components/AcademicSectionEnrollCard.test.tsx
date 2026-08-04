/** @vitest-environment jsdom */
// REGRESSION CHECK: Students-tab enroll must stay behind a CTA+modal so the roster stays scannable; Modal stays mounted (open prop) like create-section/cohort so native <dialog> does not lose open on mount races; opening must expose search + enroll actions.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionEnrollCard } from "@/components/organisms/AcademicSectionEnrollCard";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/admin/academics/actions", () => ({
  searchAdminStudentsAction: vi.fn(async () => []),
  previewSectionEnrollmentAction: vi.fn(),
  enrollStudentInSectionAction: vi.fn(),
}));

vi.mock("@/components/molecules/StaffSearchComboboxWithChipQueue", () => ({
  StaffSearchComboboxWithChipQueue: ({
    labelText,
    id,
  }: {
    labelText: string;
    id: string;
  }) => (
    <div data-testid="enroll-search">
      <label htmlFor={id}>{labelText}</label>
      <input id={id} />
    </div>
  ),
}));

const dict = {
  enrollOpenButton: "Enroll student",
  enrollTitle: "Enroll student",
  enrollModalLead: "Search and add students to this section.",
  studentSearchLabel: "Search",
  studentSearchTooltip: "tip",
  searchPlaceholder: "Type…",
  searchMin: "min",
  enrollSearchResultsHeading: "Available",
  removePickedStudentAria: "Remove",
  enrollQueueLegend: "Queue",
  enrollQueueReminder: "Remember",
  previewAll: "Check all",
  enrollAll: "Enroll all",
  bulkPreviewAllOk: "all {{count}}",
  bulkPreviewIssues: "issues {{detail}}",
  bulkEnrollDoneMany: "done {{count}}",
  bulkEnrollPartial: "partial {{ok}} {{total}} {{names}}",
  bulkEnrollFailed: "fail {{total}} {{names}}",
  parentPendingWarning: "pending",
  preview: "Check schedule",
  previewOk: "ok",
  capacityOverride: "Allow capacity override (admin)",
  enroll: "Enroll",
  successEnroll: "saved",
} as const;

const conflictDict = {
  title: "Conflict",
  lead: "Lead",
  confirmDrop: "Confirm",
  cancel: "Cancel",
} as unknown as Parameters<typeof AcademicSectionEnrollCard>[0]["conflictDict"];

describe("AcademicSectionEnrollCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps enroll controls inside a modal until the open button is pressed", async () => {
    const user = userEvent.setup();
    render(
      <AcademicSectionEnrollCard
        locale="en"
        sectionId="sec-1"
        sectionLabel="Morning A"
        dict={dict as never}
        conflictDict={conflictDict}
        errors={{ RPC: "rpc" } as never}
      />,
    );

    expect(screen.getByRole("button", { name: dict.enrollOpenButton })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: dict.enroll })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: dict.enrollOpenButton }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: dict.enrollTitle })).toBeInTheDocument();
    expect(within(dialog).getByText(dict.enrollModalLead)).toBeInTheDocument();
    expect(within(dialog).getByTestId("enroll-search")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: dict.enroll })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: dict.preview })).toBeInTheDocument();
  });
});
