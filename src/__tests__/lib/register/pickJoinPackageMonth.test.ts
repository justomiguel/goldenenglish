/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { pickJoinPackageMonth } from "@/lib/register/pickJoinPackageMonth";

describe("pickJoinPackageMonth", () => {
  it("charges this month when a class still remains", () => {
    expect(
      pickJoinPackageMonth({
        hasRemainingClassThisMonth: true,
        sectionStartsOn: "2026-03-01",
        sectionEndsOn: "2026-12-31",
        now: new Date("2026-08-10T15:00:00.000Z"),
        timeZone: "UTC",
      }),
    ).toEqual({ year: 2026, month: 8 });
  });

  it("charges next month when this month has no remaining class", () => {
    expect(
      pickJoinPackageMonth({
        hasRemainingClassThisMonth: false,
        sectionStartsOn: "2026-03-01",
        sectionEndsOn: "2026-12-31",
        now: new Date("2026-08-29T15:00:00.000Z"),
        timeZone: "UTC",
      }),
    ).toEqual({ year: 2026, month: 9 });
  });

  it("returns null when next month is outside the section cycle", () => {
    expect(
      pickJoinPackageMonth({
        hasRemainingClassThisMonth: false,
        sectionStartsOn: "2026-03-01",
        sectionEndsOn: "2026-08-31",
        now: new Date("2026-08-29T15:00:00.000Z"),
        timeZone: "UTC",
      }),
    ).toBeNull();
  });

  it("charges September when the section has not started in August", () => {
    expect(
      pickJoinPackageMonth({
        hasRemainingClassThisMonth: false,
        sectionStartsOn: "2026-09-01",
        sectionEndsOn: "2026-12-31",
        now: new Date("2026-08-10T15:00:00.000Z"),
        timeZone: "UTC",
      }),
    ).toEqual({ year: 2026, month: 9 });
  });
});
