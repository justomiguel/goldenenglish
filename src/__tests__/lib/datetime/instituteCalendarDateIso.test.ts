import { describe, expect, it } from "vitest";
import { instituteCalendarDateIso, instituteWeekday0SunFromYmd } from "@/lib/datetime/instituteCalendarDateIso";

describe("instituteCalendarDateIso", () => {
  it("returns Cordoba civil date for a UTC instant", () => {
    const ms = Date.UTC(2025, 3, 16, 15, 0, 0);
    expect(instituteCalendarDateIso(new Date(ms), "America/Argentina/Cordoba")).toBe("2025-04-16");
  });

  it("resolves weekday in the institute zone for YMD labels", () => {
    expect(instituteWeekday0SunFromYmd("2026-04-13", "America/Argentina/Cordoba")).toBe(1);
  });
});
