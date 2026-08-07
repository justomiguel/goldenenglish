/** @vitest-environment jsdom */
// REGRESSION CHECK: Teachers-tab staff editors must stay behind CTAs+modals so chips stay scannable; each open must expose the matching save control without always-on forms on the tab.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionStaffEditor } from "@/components/organisms/AcademicSectionStaffEditor";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/academic",
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionStaffActions", () => ({
  updateAcademicSectionTeacherAction: vi.fn(),
  replaceAcademicSectionAssistantsAction: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionExternalAssistantsActions", () => ({
  replaceAcademicSectionExternalAssistantsAction: vi.fn(),
}));

vi.mock("@/components/molecules/AdminStudentSearchCombobox", () => ({
  AdminStudentSearchCombobox: ({ labelText, id }: { labelText: string; id: string }) => (
    <div data-testid="student-assistant-search">
      <label htmlFor={id}>{labelText}</label>
      <input id={id} />
    </div>
  ),
}));

const dict = {
  title: "Teaching staff",
  manageBlockLead: "Manage staff for this section.",
  leadOpenButton: "Change lead teacher",
  leadModalTitle: "Lead teacher",
  leadLabel: "Lead teacher",
  leadSave: "Save lead teacher",
  leadSaved: "Lead teacher updated.",
  leadError: "Could not update the lead teacher. Try again.",
  assistantsOpenButton: "Manage assistants",
  assistantsModalTitle: "Assistants (portal access)",
  assistantsTitle: "Assistants (portal access)",
  assistantsHint: "Hint",
  pickStaffAssistantLabel: "Add teacher or staff assistant",
  addStaffAssistantSubmit: "Add",
  staffAssistantPlaceholder: "Choose…",
  pickStudentAssistantLabel: "Add student assistant (search)",
  studentAssistantMinHint: "Prefix…",
  assistantsSave: "Save assistants",
  assistantsSaved: "Assistants updated.",
  assistantsError: "Could not update assistants. Try again.",
  assistantsScheduleOverlap: "Overlap",
  removeAssistantAria: "Remove assistant",
  assistantBadgeTeacher: "Teacher",
  assistantBadgeStudent: "Student",
  assistantBadgePortalAssistant: "Assistant (staff)",
  externalOpenButton: "Manage external assistants",
  externalModalTitle: "External assistants (no login)",
  externalTitle: "External assistants (no login)",
  externalHint: "External hint",
  externalNameLabel: "Name",
  externalNamePlaceholder: "Full name",
  externalAdd: "Add",
  externalSave: "Save external assistants",
  externalSaved: "External assistants updated.",
  externalError: "Could not save external assistants. Try again.",
  removeExternalAria: "Remove external assistant",
};

describe("AcademicSectionStaffEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps lead, assistants, and external editors inside modals until each CTA is pressed", async () => {
    const user = userEvent.setup();
    render(
      <AcademicSectionStaffEditor
        locale="en"
        sectionId="sec-1"
        teachers={[{ id: "t1", label: "Vargas, Justo" }]}
        assistantPortalStaffOptions={[]}
        initialTeacherId="t1"
        initialAssistants={[]}
        initialExternalAssistants={[]}
        dict={dict}
      />,
    );

    expect(screen.getByRole("button", { name: dict.leadOpenButton })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: dict.assistantsOpenButton })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: dict.externalOpenButton })).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: dict.leadSave })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: dict.assistantsSave })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: dict.externalSave })).not.toBeInTheDocument();
    expect(screen.queryByTestId("student-assistant-search")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: dict.leadOpenButton }));
    const leadDialog = screen.getByRole("dialog");
    expect(within(leadDialog).getByRole("heading", { name: dict.leadModalTitle })).toBeInTheDocument();
    expect(within(leadDialog).getByRole("button", { name: dict.leadSave })).toBeInTheDocument();
    expect(within(leadDialog).getByLabelText(dict.leadLabel)).toBeInTheDocument();
    await user.click(within(leadDialog).getByRole("button", { name: /close/i }));

    await user.click(screen.getByRole("button", { name: dict.assistantsOpenButton }));
    const asstDialog = screen.getByRole("dialog");
    expect(within(asstDialog).getByRole("heading", { name: dict.assistantsModalTitle })).toBeInTheDocument();
    expect(within(asstDialog).getByRole("button", { name: dict.assistantsSave })).toBeInTheDocument();
    expect(within(asstDialog).getByTestId("student-assistant-search")).toBeInTheDocument();
    await user.click(within(asstDialog).getByRole("button", { name: /close/i }));

    await user.click(screen.getByRole("button", { name: dict.externalOpenButton }));
    const extDialog = screen.getByRole("dialog");
    expect(within(extDialog).getByRole("heading", { name: dict.externalModalTitle })).toBeInTheDocument();
    expect(within(extDialog).getByRole("button", { name: dict.externalSave })).toBeInTheDocument();
    expect(within(extDialog).getByLabelText(dict.externalNameLabel)).toBeInTheDocument();
  });
});
