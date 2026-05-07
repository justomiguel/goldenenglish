import { describe, it, expect } from "vitest";
import { instituteTwoWeekBirthdayRange } from "@/lib/birthdays/instituteTwoWeekBirthdayRange";

// REGRESSION CHECK: dashboard card window must stay aligned with instituto America/Argentina/Cordoba (Monday-based twin weeks).
describe("instituteTwoWeekBirthdayRange", () => {
  it("returns 14 days from Monday of the week containing anchor Wednesday", () => {
    const anchor = new Date("2026-05-06T15:00:00.000Z");
    const { startIso, endIso } = instituteTwoWeekBirthdayRange(anchor);
    expect(startIso).toBe("2026-05-04");
    expect(endIso).toBe("2026-05-17");
  });
});
