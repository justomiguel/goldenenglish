import { describe, it, expect } from "vitest";
import {
  daysInCalendarMonth,
  isoDateFromBirthTripletParts,
  parseIsoBirthDateParts,
} from "@/lib/register/birthDateTriplet";

describe("birthDateTriplet", () => {
  it("parses ISO and rejects Feb 30", () => {
    expect(parseIsoBirthDateParts("2020-06-01")).toEqual({
      y: 2020,
      m: 6,
      d: 1,
    });
    expect(parseIsoBirthDateParts("2020-02-30")).toBeNull();
  });

  it("computes leap-year February length", () => {
    expect(daysInCalendarMonth(2024, 2)).toBe(29);
    expect(daysInCalendarMonth(2023, 2)).toBe(28);
  });

  it("builds ISO for valid triplets relative to fixed today", () => {
    const today = new Date(2026, 4, 10);
    expect(isoDateFromBirthTripletParts(1990, 5, 4, today)).toBe("1990-05-04");
    expect(isoDateFromBirthTripletParts(1905, 1, 2, today)).toBe(null);
    expect(isoDateFromBirthTripletParts(null, null, null, today)).toBe(null);
    expect(isoDateFromBirthTripletParts(2028, 1, 2, today)).toBe(null);
  });
});
