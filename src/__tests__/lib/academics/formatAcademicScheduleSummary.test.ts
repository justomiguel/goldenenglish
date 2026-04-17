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

  it("coerces string dayOfWeek like the attendance matrix parser", () => {
    const s = [{ dayOfWeek: "0", startTime: "10:00", endTime: "11:00" }];
    const out = formatAcademicScheduleSummary(s, "en");
    expect(out.length).toBeGreaterThan(0);
  });

  it("labels Sunday (dayOfWeek 0) in Spanish as domingo family, not shifted by local TZ", () => {
    const out = formatAcademicScheduleSummary(
      [{ dayOfWeek: 0, startTime: "13:09", endTime: "15:09" }],
      "es",
    );
    expect(out.toLowerCase()).toMatch(/dom/);
    expect(out.toLowerCase()).not.toMatch(/^sáb|^sat/);
  });
});
