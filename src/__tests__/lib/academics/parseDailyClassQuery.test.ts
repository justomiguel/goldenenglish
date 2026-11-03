import { describe, expect, it } from "vitest";
import { parseDailyClassQuery } from "@/lib/academics/parseDailyClassQuery";

describe("parseDailyClassQuery", () => {
  it("accepts a weekday and HH:MM start", () => {
    expect(parseDailyClassQuery({ day: "1", start: "18:00" })).toEqual({
      dayOfWeek: 1,
      startTime: "18:00",
    });
  });

  it("rejects an out-of-range day or a bad start", () => {
    expect(parseDailyClassQuery({ day: "7", start: "18:00" })).toBeNull();
    expect(parseDailyClassQuery({ day: "1", start: "25:00" })).toBeNull();
    expect(parseDailyClassQuery({ day: "1", start: "9:00" })).toBeNull();
  });
});
