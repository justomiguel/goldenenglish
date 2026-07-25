import { describe, expect, it } from "vitest";
import { listSectionScheduleHourTicks } from "@/lib/academics/sectionScheduleHourTicks";

describe("listSectionScheduleHourTicks", () => {
  it("lists full hours inside the window", () => {
    expect(listSectionScheduleHourTicks(7 * 60, 10 * 60)).toEqual([
      7 * 60,
      8 * 60,
      9 * 60,
      10 * 60,
    ]);
  });

  it("starts at the next full hour when the window begins mid-hour", () => {
    expect(listSectionScheduleHourTicks(7 * 60 + 30, 9 * 60)).toEqual([8 * 60, 9 * 60]);
  });
});
