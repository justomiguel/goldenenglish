/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionWeekScheduleEditor } from "@/components/organisms/AcademicSectionWeekScheduleEditor";

const refresh = vi.fn();
const updateAcademicSectionScheduleAction = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionActions", () => ({
  updateAcademicSectionScheduleAction: (...args: unknown[]) =>
    updateAcademicSectionScheduleAction(...args),
}));

const dict = {
  scheduleTitle: "Schedule",
  scheduleHint: "Edit weekly slots.",
  scheduleAddSlot: "Add slot",
  scheduleDayLabel: "Day",
  scheduleStartLabel: "Start",
  scheduleEndLabel: "End",
  scheduleInvalid: "Invalid schedule",
  saveSchedule: "Save schedule",
  saveScheduleError: "Could not save",
  unsavedBadge: "Unsaved changes",
  selectedBlockTitle: "Selected block",
  editTimes: "Edit times",
  deleteBlock: "Delete block",
  closeInspectorAria: "Close block editor",
  overlapError: "This block overlaps another on the same day.",
  createHint: "Hint",
  gridAria: "Weekly class schedule",
  weekdays: {
    sun: "Sun",
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
  },
} as const;

describe("AcademicSectionWeekScheduleEditor", () => {
  beforeEach(() => {
    refresh.mockReset();
    updateAcademicSectionScheduleAction.mockReset();
  });

  it("shows left hour labels for the visible window", () => {
    render(
      <AcademicSectionWeekScheduleEditor
        locale="en"
        sectionId="section-1"
        initialSlots={[{ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }]}
        dict={dict}
      />,
    );

    const gutter = screen.getByTestId("week-grid-time-gutter");
    expect(gutter).toHaveTextContent("08:00");
    expect(gutter).toHaveTextContent("09:00");
  });

  it("opens the inspector drawer on select and closes it", async () => {
    const user = userEvent.setup();
    render(
      <AcademicSectionWeekScheduleEditor
        locale="en"
        sectionId="section-1"
        initialSlots={[{ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }]}
        dict={dict}
      />,
    );

    expect(screen.queryByTestId("week-schedule-inspector-drawer")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mon 08:00–09:00" }));
    expect(screen.getByTestId("week-schedule-inspector-drawer")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Selected block" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close block editor" }));
    expect(screen.queryByTestId("week-schedule-inspector-drawer")).not.toBeInTheDocument();
  });

  it("marks saved vs unsaved blocks with data-schedule-state", async () => {
    const user = userEvent.setup();
    render(
      <AcademicSectionWeekScheduleEditor
        locale="en"
        sectionId="section-1"
        initialSlots={[{ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }]}
        dict={dict}
      />,
    );

    expect(screen.getByRole("button", { name: "Mon 08:00–09:00" })).toHaveAttribute(
      "data-schedule-state",
      "saved",
    );

    await user.click(screen.getByTestId("week-grid-day-2"));
    expect(screen.getByRole("button", { name: "Tue 09:00–10:00" })).toHaveAttribute(
      "data-schedule-state",
      "unsaved",
    );
  });

  it("sets dragging state only after the pointer moves past the threshold", () => {
    render(
      <AcademicSectionWeekScheduleEditor
        locale="en"
        sectionId="section-1"
        initialSlots={[{ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }]}
        dict={dict}
      />,
    );

    const block = screen.getByRole("button", { name: "Mon 08:00–09:00" });
    fireEvent.pointerDown(block, { pointerId: 1, clientX: 40, clientY: 80 });
    expect(block).toHaveAttribute("data-schedule-state", "saved");
    expect(screen.getByTestId("week-schedule-inspector-drawer")).toBeInTheDocument();

    fireEvent.pointerMove(screen.getByTestId("week-grid-days"), {
      pointerId: 1,
      clientX: 40,
      clientY: 120,
    });
    expect(screen.getByRole("button", { name: /Mon / })).toHaveAttribute(
      "data-schedule-state",
      "dragging",
    );

    fireEvent.pointerUp(screen.getByTestId("week-grid-days"), { pointerId: 1 });
  });

  it("creates a block by clicking an empty day, then saves", async () => {
    const user = userEvent.setup();
    updateAcademicSectionScheduleAction.mockResolvedValue({ ok: true });

    render(
      <AcademicSectionWeekScheduleEditor
        locale="en"
        sectionId="section-1"
        initialSlots={[{ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }]}
        dict={dict}
      />,
    );

    await user.click(screen.getByTestId("week-grid-day-2"));
    expect(screen.getByRole("button", { name: "Tue 09:00–10:00" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save schedule" }));

    await waitFor(() => expect(updateAcademicSectionScheduleAction).toHaveBeenCalledTimes(1));
    expect(updateAcademicSectionScheduleAction).toHaveBeenCalledWith({
      locale: "en",
      sectionId: "section-1",
      scheduleSlots: expect.arrayContaining([
        { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
        { dayOfWeek: 2, startTime: "09:00", endTime: "10:00" },
      ]),
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("creates a block via keyboard on a day cell", async () => {
    const user = userEvent.setup();

    render(
      <AcademicSectionWeekScheduleEditor
        locale="en"
        sectionId="section-1"
        initialSlots={[{ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }]}
        dict={dict}
      />,
    );

    const tuesdayCell = screen.getByRole("button", { name: "Add slot Tue" });
    tuesdayCell.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "Tue 09:00–10:00" })).toBeInTheDocument();
  });

  it("shows overlapError when an edit would overlap", async () => {
    const user = userEvent.setup();

    render(
      <AcademicSectionWeekScheduleEditor
        locale="en"
        sectionId="section-1"
        initialSlots={[{ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }]}
        dict={dict}
      />,
    );

    await user.click(screen.getByTestId("week-grid-day-2"));
    await user.click(screen.getByRole("button", { name: "Tue 09:00–10:00" }));

    fireEvent.change(screen.getByLabelText("Day"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("End"), { target: { value: "09:30" } });
    fireEvent.change(screen.getByLabelText("Start"), { target: { value: "08:30" } });

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(dict.overlapError),
    );
  });

  it("blocks saving when all slots are deleted", async () => {
    const user = userEvent.setup();

    render(
      <AcademicSectionWeekScheduleEditor
        locale="en"
        sectionId="section-1"
        initialSlots={[{ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }]}
        dict={dict}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Mon 08:00–09:00" }));
    await user.click(screen.getByRole("button", { name: "Delete block" }));
    await user.click(screen.getByRole("button", { name: "Save schedule" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid schedule"),
    );
    expect(updateAcademicSectionScheduleAction).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});

