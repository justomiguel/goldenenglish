import { describe, expect, it } from "vitest";
import { formatEventDay } from "@/lib/events/formatEventDate";

describe("formatEventDay", () => {
  it("formats a timestamp that already includes a time", () => {
    const label = formatEventDay("2026-11-01T18:00:00+00:00", "en");
    expect(label).toMatch(/Nov/);
    expect(label).toMatch(/1/);
  });

  it("formats a date-only value without shifting the calendar day", () => {
    expect(formatEventDay("2026-11-01", "en-US")).toMatch(/Nov/);
  });

  it("returns an empty string for a blank or invalid value", () => {
    expect(formatEventDay("", "en")).toBe("");
    expect(formatEventDay("not-a-date", "en")).toBe("");
  });
});
