/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { sectionHasRemainingClassThisMonth } from "@/lib/register/sectionHasRemainingClassThisMonth";

const WED = { dayOfWeek: 3, startTime: "18:00", endTime: "19:00" };

describe("sectionHasRemainingClassThisMonth", () => {
  it("is true when a later class this month has not started", () => {
    expect(
      sectionHasRemainingClassThisMonth({
        slots: [WED],
        startsOn: "2026-03-01",
        endsOn: "2026-12-31",
        now: new Date("2026-08-10T15:00:00.000Z"),
        timeZone: "UTC",
      }),
    ).toBe(true);
  });

  it("is false when the last class this month already started", () => {
    expect(
      sectionHasRemainingClassThisMonth({
        slots: [WED],
        startsOn: "2026-03-01",
        endsOn: "2026-12-31",
        now: new Date("2026-08-26T18:01:00.000Z"),
        timeZone: "UTC",
      }),
    ).toBe(false);
  });

  it("is true when today's class has not started yet", () => {
    expect(
      sectionHasRemainingClassThisMonth({
        slots: [WED],
        startsOn: "2026-03-01",
        endsOn: "2026-12-31",
        now: new Date("2026-08-26T17:00:00.000Z"),
        timeZone: "UTC",
      }),
    ).toBe(true);
  });

  it("is false when slots are empty or the cycle has already ended", () => {
    expect(
      sectionHasRemainingClassThisMonth({
        slots: [],
        startsOn: "2026-03-01",
        endsOn: "2026-12-31",
        now: new Date("2026-08-10T15:00:00.000Z"),
        timeZone: "UTC",
      }),
    ).toBe(false);
    expect(
      sectionHasRemainingClassThisMonth({
        slots: [WED],
        startsOn: "2026-03-01",
        endsOn: "2026-08-10",
        now: new Date("2026-08-11T15:00:00.000Z"),
        timeZone: "UTC",
      }),
    ).toBe(false);
  });

  it("ignores class days before starts_on", () => {
    expect(
      sectionHasRemainingClassThisMonth({
        slots: [WED],
        startsOn: "2026-08-20",
        endsOn: "2026-12-31",
        now: new Date("2026-08-10T15:00:00.000Z"),
        timeZone: "UTC",
      }),
    ).toBe(true);
  });
});
