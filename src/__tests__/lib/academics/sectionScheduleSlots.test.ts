import { describe, it, expect } from "vitest";
import {
  normalizeSectionScheduleSlots,
  parseSectionScheduleSlots,
} from "@/lib/academics/sectionScheduleSlots";

describe("sectionScheduleSlots", () => {
  // REGRESSION CHECK: schedule_slots feeds enrollment conflict checks, student
  // weekly schedules, copy-section flows, and now admin CRUD. Invalid or
  // unsorted slots must not leak into those surfaces.
  it("normalizes valid slots and sorts them by weekday and time", () => {
    expect(
      normalizeSectionScheduleSlots([
        { dayOfWeek: 4, startTime: "18:00", endTime: "19:00" },
        { dayOfWeek: 1, startTime: "10:00", endTime: "11:00" },
        { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
      ]),
    ).toEqual([
      { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
      { dayOfWeek: 1, startTime: "10:00", endTime: "11:00" },
      { dayOfWeek: 4, startTime: "18:00", endTime: "19:00" },
    ]);
  });

  it("returns null when a slot time is malformed", () => {
    expect(
      normalizeSectionScheduleSlots([
        { dayOfWeek: 1, startTime: "8:00", endTime: "09:00" },
      ]),
    ).toBeNull();
  });

  it("returns null when end time is not after start time", () => {
    expect(
      normalizeSectionScheduleSlots([
        { dayOfWeek: 2, startTime: "11:00", endTime: "11:00" },
      ]),
    ).toBeNull();
  });

  it("keeps parseSectionScheduleSlots lenient for invalid persisted payloads", () => {
    expect(
      parseSectionScheduleSlots([{ dayOfWeek: 9, startTime: "10:00", endTime: "11:00" }]),
    ).toEqual([]);
  });

  it("parseSectionScheduleSlots accepts string dayOfWeek and HH:MM:SS times", () => {
    expect(
      parseSectionScheduleSlots([
        { dayOfWeek: "0", startTime: "16:00:00", endTime: "18:00:00" },
      ]),
    ).toEqual([{ dayOfWeek: 0, startTime: "16:00", endTime: "18:00" }]);
  });

  it("parseSectionScheduleSlots drops rows with a missing day or a blank time and ignores non-arrays", () => {
    expect(parseSectionScheduleSlots(null)).toEqual([]);
    expect(parseSectionScheduleSlots("nope")).toEqual([]);
    expect(
      parseSectionScheduleSlots([
        { dayOfWeek: 2, startTime: "", endTime: "19:00" },
        { startTime: "18:00", endTime: "19:00" },
        { dayOfWeek: 2, startTime: "18:00", endTime: "19:00" },
      ]),
    ).toEqual([{ dayOfWeek: 2, startTime: "18:00", endTime: "19:00" }]);
  });

  it("parseSectionScheduleSlots sorts surviving rows by weekday then start time", () => {
    expect(
      parseSectionScheduleSlots([
        { dayOfWeek: 3, startTime: "09:00", endTime: "10:00" },
        { dayOfWeek: 1, startTime: "18:00", endTime: "19:00" },
        { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
      ]).map((s) => `${s.dayOfWeek}@${s.startTime}`),
    ).toEqual(["1@08:00", "1@18:00", "3@09:00"]);
  });

  it("normalizeSectionScheduleSlots returns null when not every row parses", () => {
    expect(
      normalizeSectionScheduleSlots([
        { dayOfWeek: 1, startTime: "10:00", endTime: "11:00" },
        { dayOfWeek: 9, startTime: "10:00", endTime: "11:00" },
      ]),
    ).toBeNull();
  });
});
