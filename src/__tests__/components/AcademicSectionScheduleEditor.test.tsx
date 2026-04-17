/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionScheduleEditor } from "@/components/organisms/AcademicSectionScheduleEditor";

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
  scheduleRemoveSlot: "Remove slot",
  scheduleDayLabel: "Day",
  scheduleStartLabel: "Start",
  scheduleEndLabel: "End",
  scheduleInvalid: "Invalid schedule",
  saveSchedule: "Save schedule",
  saveScheduleError: "Could not save",
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

describe("AcademicSectionScheduleEditor", () => {
  it("blocks saving when an admin removes every slot (a section must keep at least one)", async () => {
    const user = userEvent.setup();
    updateAcademicSectionScheduleAction.mockResolvedValue({ ok: true });

    render(
      <AcademicSectionScheduleEditor
        locale="en"
        sectionId="section-1"
        initialSlots={[{ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }]}
        dict={dict}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove slot" }));
    await user.click(screen.getByRole("button", { name: "Save schedule" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid schedule"),
    );
    expect(updateAcademicSectionScheduleAction).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
