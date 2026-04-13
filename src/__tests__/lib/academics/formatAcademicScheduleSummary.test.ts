import { describe, expect, it } from "vitest";
import { formatAcademicScheduleSummary } from "@/lib/academics/formatAcademicScheduleSummary";

describe("formatAcademicScheduleSummary", () => {
  it("returns empty string for non-array", () => {
    expect(formatAcademicScheduleSummary(null, "en")).toBe("");
  });

  it("formats day and time range", () => {
    const s = [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }];
    const out = formatAcademicScheduleSummary(s, "en");
    expect(out).toContain("09:00");
    expect(out).toContain("10:00");
  });
});
