/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicNewSectionModal } from "@/components/organisms/AcademicNewSectionModal";

const push = vi.fn();
const refresh = vi.fn();
const createAcademicSectionAction = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionActions", () => ({
  createAcademicSectionAction: (...args: unknown[]) => createAcademicSectionAction(...args),
}));

const dict = {
  title: "Create section",
  nameLabel: "Section name",
  teacherLabel: "Teacher",
  teacherPlaceholder: "Select a teacher",
  maxStudentsLabel: "Maximum students",
  maxStudentsDefaultHint: "Default hint",
  maxStudentsCustomize: "Customize max",
  maxStudentsCustomLabel: "Custom maximum",
  maxStudentsCustomHint: "Custom hint",
  maxStudentsInvalid: "Invalid max",
  submit: "Create",
  cancel: "Cancel",
  error: "Could not create the section.",
  noTeachers: "No teachers",
  scheduleTitle: "Schedule",
  scheduleHint: "Add at least one slot.",
  scheduleAddSlot: "Add slot",
  scheduleRemoveSlot: "Remove slot",
  scheduleDayLabel: "Day",
  scheduleStartLabel: "Slot start time",
  scheduleEndLabel: "Slot end time",
  scheduleInvalid: "Invalid schedule",
  weekdays: {
    sun: "Sun",
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
  },
  sectionPeriodStartsLabel: "Start",
  sectionPeriodEndsLabel: "End",
} as const;

describe("AcademicNewSectionModal", () => {
  it("submits the created section with schedule slots", async () => {
    const user = userEvent.setup();
    const today = new Date().toISOString().slice(0, 10);
    createAcademicSectionAction.mockResolvedValue({ ok: true, id: "section-1" });

    render(
      <AcademicNewSectionModal
        locale="en"
        cohortId="cohort-1"
        open
        onOpenChange={() => {}}
        teachers={[{ id: "teacher-1", label: "Ada Lovelace" }]}
        defaultMaxStudents={10}
        dict={dict}
      />,
    );

    await user.type(screen.getByLabelText("Section name"), "Morning A1");
    await user.selectOptions(screen.getByLabelText("Teacher"), "teacher-1");
    await user.selectOptions(screen.getByLabelText("Day"), "1");
    await user.type(screen.getByLabelText("Slot start time"), "08:00");
    await user.type(screen.getByLabelText("Slot end time"), "09:00");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(createAcademicSectionAction).toHaveBeenCalledWith({
        locale: "en",
        cohortId: "cohort-1",
        name: "Morning A1",
        teacherId: "teacher-1",
        startsOn: today,
        endsOn: today,
        maxStudents: null,
        scheduleSlots: [{ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }],
      }),
    );
    expect(push).toHaveBeenCalledWith("/en/dashboard/admin/academic/cohort-1/section-1");
    expect(refresh).toHaveBeenCalled();
  });

  it("lets the user add and remove schedule rows", async () => {
    const user = userEvent.setup();
    createAcademicSectionAction.mockResolvedValue({ ok: false });

    render(
      <AcademicNewSectionModal
        locale="en"
        cohortId="cohort-1"
        open
        onOpenChange={() => {}}
        teachers={[{ id: "teacher-1", label: "Ada Lovelace" }]}
        defaultMaxStudents={10}
        dict={dict}
      />,
    );

    expect(screen.getAllByLabelText("Day")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Add slot" }));
    expect(screen.getAllByLabelText("Day")).toHaveLength(2);
    await user.click(screen.getAllByRole("button", { name: "Remove slot" })[1]!);
    expect(screen.getAllByLabelText("Day")).toHaveLength(1);
  });
});
