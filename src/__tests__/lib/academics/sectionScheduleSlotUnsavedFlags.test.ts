import { describe, expect, it } from "vitest";
import { buildSectionScheduleSlotUnsavedFlags } from "@/lib/academics/sectionScheduleSlotUnsavedFlags";
import type { SectionScheduleSlot } from "@/types/academics";

describe("buildSectionScheduleSlotUnsavedFlags", () => {
  it("marks matching slots as saved and new ones as unsaved", () => {
    const initial: SectionScheduleSlot[] = [
      { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
    ];
    const draft: SectionScheduleSlot[] = [
      { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
      { dayOfWeek: 2, startTime: "10:00", endTime: "11:00" },
    ];
    expect(buildSectionScheduleSlotUnsavedFlags(draft, initial)).toEqual([false, true]);
  });

  it("marks a moved slot as unsaved (multiset consumes one match)", () => {
    const initial: SectionScheduleSlot[] = [
      { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
      { dayOfWeek: 3, startTime: "14:00", endTime: "15:00" },
    ];
    const draft: SectionScheduleSlot[] = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
      { dayOfWeek: 3, startTime: "14:00", endTime: "15:00" },
    ];
    expect(buildSectionScheduleSlotUnsavedFlags(draft, initial)).toEqual([true, false]);
  });

  it("handles duplicate identical slots with multiplicity", () => {
    const initial: SectionScheduleSlot[] = [
      { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
      { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
    ];
    const draft: SectionScheduleSlot[] = [
      { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
      { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
      { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
    ];
    expect(buildSectionScheduleSlotUnsavedFlags(draft, initial)).toEqual([false, false, true]);
  });
});
