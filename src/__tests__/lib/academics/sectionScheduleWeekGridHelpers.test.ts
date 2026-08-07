import { describe, expect, it } from "vitest";
import { snapMinutesToStep, minutesToHhMm } from "@/lib/academics/sectionScheduleTimeSnap";
import { defaultSectionScheduleDurationMinutes } from "@/lib/academics/sectionScheduleDefaultDuration";
import { sectionScheduleSlotSelfOverlaps } from "@/lib/academics/sectionScheduleSelfOverlap";
import {
  SECTION_WEEK_UI_DAY_ORDER,
  sectionWeekUiColumnIndex,
} from "@/lib/academics/sectionScheduleWeekColumns";

describe("sectionScheduleTimeSnap", () => {
  it("snaps to 15-minute boundaries", () => {
    expect(snapMinutesToStep(67)).toBe(60);
    expect(snapMinutesToStep(68)).toBe(75);
    expect(minutesToHhMm(75)).toBe("01:15");
  });
});

describe("defaultSectionScheduleDurationMinutes", () => {
  it("returns 60 when empty", () => {
    expect(defaultSectionScheduleDurationMinutes([])).toBe(60);
  });
  it("returns the mode of existing durations", () => {
    expect(
      defaultSectionScheduleDurationMinutes([
        { startTime: "09:00", endTime: "10:00" },
        { startTime: "11:00", endTime: "12:00" },
        { startTime: "14:00", endTime: "15:30" },
      ]),
    ).toBe(60);
  });
  it("picks the shortest duration when counts tie", () => {
    expect(
      defaultSectionScheduleDurationMinutes([
        { startTime: "09:00", endTime: "10:00" },
        { startTime: "11:00", endTime: "12:00" },
        { startTime: "14:00", endTime: "15:30" },
        { startTime: "16:00", endTime: "17:30" },
      ]),
    ).toBe(60);
    expect(
      defaultSectionScheduleDurationMinutes([
        { startTime: "09:00", endTime: "10:00" },
        { startTime: "14:00", endTime: "15:30" },
      ]),
    ).toBe(60);
  });
});

describe("sectionScheduleSlotSelfOverlaps", () => {
  it("detects same-day overlap and ignores self index", () => {
    const slots = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
      { dayOfWeek: 1, startTime: "10:00", endTime: "11:00" },
    ];
    expect(
      sectionScheduleSlotSelfOverlaps(slots, {
        dayOfWeek: 1,
        startTime: "09:30",
        endTime: "10:30",
      }),
    ).toBe(true);
    expect(
      sectionScheduleSlotSelfOverlaps(
        slots,
        { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
        0,
      ),
    ).toBe(false);
  });
});

describe("sectionScheduleWeekColumns", () => {
  it("orders Mon→Sun for UI", () => {
    expect(SECTION_WEEK_UI_DAY_ORDER).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(sectionWeekUiColumnIndex(0)).toBe(6);
    expect(sectionWeekUiColumnIndex(1)).toBe(0);
  });
});
